import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, gameType, trumpSuit } = await req.json();
    
    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: 'No image provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const trumpSuitMap: Record<string, string> = {
      'hearts': 'الهارت (القلب)',
      'diamonds': 'الدينار (الماس)', 
      'clubs': 'الكلب (السباتي)',
      'spades': 'البستوني (الليف)'
    };
    const trumpSuitName = trumpSuit ? trumpSuitMap[trumpSuit] || '' : '';

    const systemPrompt = `أنت خبير في لعبة البلوت. مهمتك تحليل صورة أوراق اللعب وحساب النقاط.

${gameType === 'صن' ? `
نوع اللعب: صن (بدون حكم - كل الأنواع نفس القيمة)

قيم الأوراق:
- الآس (A) = 11 نقطة
- العشرة (10) = 10 نقاط
- الملك (K) = 4 نقاط
- البنت (Q) = 3 نقاط
- الشايب/الولد (J) = 2 نقاط
- 9 / 8 / 7 = 0 نقاط

المجموع الكلي في الصن = 130 نقطة
` : `
نوع اللعب: حكم
نوع الحكم (الطرنيب): ${trumpSuitName}

أوراق الحكم (${trumpSuitName}):
- الشايب/الولد (J) = 20 نقطة
- التسعة (9) = 14 نقطة
- الآس (A) = 11 نقطة
- العشرة (10) = 10 نقاط
- الملك (K) = 4 نقاط
- البنت (Q) = 3 نقاط
- 8 / 7 = 0 نقاط

أوراق غير الحكم (الأنواع الأخرى):
- الآس (A) = 11 نقطة
- العشرة (10) = 10 نقاط
- الملك (K) = 4 نقاط
- البنت (Q) = 3 نقاط
- الشايب/الولد (J) = 2 نقاط
- 9 / 8 / 7 = 0 نقاط

المجموع الكلي في الحكم = 162 نقطة

مهم جداً: يجب التفريق بين أوراق الحكم (${trumpSuitName}) وباقي الأوراق عند الحساب!
`}

المشاريع:
- سرا (3 أوراق متتالية من نفس النوع) = 20 نقطة
- خمسين (4 أوراق متتالية من نفس النوع) = 50 نقطة
- مية (5+ أوراق متتالية من نفس النوع) = 100 نقطة
- بلوط (الملك والبنت من نفس النوع) = 20 نقطة

المطلوب:
1. حدد كل الأوراق الموجودة في الصورة بدقة (النوع والرقم)
2. صنف كل ورقة: هل هي من الحكم أم لا (إذا كان اللعب حكم)
3. احسب نقاط كل ورقة حسب تصنيفها
4. اجمع نقاط الأكلات (نقاط الأوراق فقط)
5. حدد أي مشاريع موجودة واحسب نقاطها
6. اجمع النقاط الكلية (أكلات + مشاريع)

أجب بصيغة JSON فقط:
{
  "cards": ["وصف تفصيلي لكل ورقة مع قيمتها"],
  "trickPoints": رقم_نقاط_الأكلات,
  "projects": [{"name": "اسم المشروع", "points": رقم}],
  "totalPoints": رقم_المجموع_الكلي,
  "notes": "ملاحظات عن الحساب"
}`;
    console.log('Sending request to AI gateway for card analysis...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { 
            role: 'user', 
            content: [
              { type: 'text', text: 'حلل هذه الأوراق واحسب النقاط:' },
              { 
                type: 'image_url', 
                image_url: { url: imageBase64 }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'تم تجاوز حد الطلبات، حاول مرة أخرى لاحقاً' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'يرجى إضافة رصيد لاستخدام الذكاء الاصطناعي' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    console.log('AI response:', content);

    // Try to parse JSON from the response
    let result;
    try {
      // Extract JSON from the response (it might be wrapped in markdown code blocks)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      result = {
        cards: [],
        trickPoints: 0,
        projects: [],
        totalPoints: 0,
        notes: content,
        parseError: true
      };
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-cards function:', error);
    const errorMessage = error instanceof Error ? error.message : 'حدث خطأ غير متوقع';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
