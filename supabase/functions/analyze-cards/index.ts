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

قيم الأوراق (كل الأنواع متساوية):
- الآس (A) = 11 نقطة
- العشرة (10) = 10 نقاط
- الملك (K) = 4 نقاط
- البنت (Q) = 3 نقاط
- الشايب/الولد (J) = 2 نقاط
- 9 / 8 / 7 = 0 نقاط

المجموع الكلي للأوراق في الصن = 130 بنط (يضاف 10 للأرض = 140، ثم تضاعف = 260 بنط)
المجموع النهائي = 26 نقطة (بعد القسمة على 10)

قيم المشاريع في الصن:
- سرا (3 أوراق متتالية من نفس النوع) = 4 أبناط
- خمسين (4 أوراق متتالية من نفس النوع) = 10 أبناط
- مية (5 أوراق متتالية من نفس النوع) = 20 بنط
- أربع مية (4 إكك أو 4 خوال متشابهة) = 40 بنط
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

المجموع الكلي للأوراق في الحكم = 152 بنط (يضاف 10 للأرض = 162 بنط)
المجموع النهائي = 16 نقطة (بعد القسمة على 10 والتقريب)

قيم المشاريع في الحكم:
- سرا (3 أوراق متتالية من نفس النوع) = 2 بنطين
- خمسين (4 أوراق متتالية من نفس النوع) = 5 أبناط
- مية (5 أوراق متتالية أو 4 شوايب/بنات/عشرات) = 10 أبناط
- مية (4 إكك في الحكم فقط) = 10 أبناط
- بلوت (شايب وبنت الحكم معاً) = 2 بنطين (لا يُضاعف مع الدبل)

مهم جداً: يجب التفريق بين أوراق الحكم (${trumpSuitName}) وباقي الأوراق عند الحساب!
`}

قواعد التقريب:
- أقل من 5 يُكسر للرقم الأقل (مثال: 34 = 3)
- أكثر من 5 يُجبر للرقم الأكبر (مثال: 36 = 4)
- في الصن: العدد المناصف يُضاعف (مثال: 35 → 3.5 × 2 = 7)
- في الحكم: العدد المناصف يُكسر (مثال: 45 = 4)

المطلوب:
1. حدد كل الأوراق الموجودة في الصورة بدقة (النوع والرقم)
2. ${gameType === 'حكم' ? `صنف كل ورقة: هل هي من الحكم (${trumpSuitName}) أم لا` : 'احسب قيمة كل ورقة'}
3. احسب مجموع نقاط الأوراق (البنط الخام)
4. حدد أي مشاريع موجودة واحسب نقاطها
5. أعطني النتائج التالية:
   - rawPoints: مجموع نقاط الأوراق الخام (بدون الأرض)
   - projects: المشاريع مع نقاطها
   - projectsTotal: مجموع نقاط المشاريع

أجب بصيغة JSON فقط:
{
  "cards": ["وصف تفصيلي لكل ورقة مع قيمتها"],
  "rawPoints": رقم_البنط_الخام,
  "projects": [{"name": "اسم المشروع", "points": رقم}],
  "projectsTotal": رقم_مجموع_المشاريع,
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
