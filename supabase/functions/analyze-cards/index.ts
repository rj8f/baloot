import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation constants
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const VALID_GAME_TYPES = ['صن', 'حكم'];
const VALID_TRUMP_SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'غير مصرح' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: authError } = await supabaseClient.auth.getClaims(token);

    if (authError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'غير مصرح' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { imageBase64, gameType, trumpSuit } = await req.json();
    
    // Input validation
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return new Response(
        JSON.stringify({ error: 'بيانات الصورة غير صالحة' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check image size
    if (imageBase64.length > MAX_IMAGE_SIZE) {
      return new Response(
        JSON.stringify({ error: 'الصورة كبيرة جداً (الحد الأقصى 10 ميجابايت)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate base64 format
    if (!imageBase64.match(/^data:image\/(jpeg|jpg|png|webp);base64,/)) {
      return new Response(
        JSON.stringify({ error: 'صيغة الصورة غير صالحة' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate gameType
    if (!VALID_GAME_TYPES.includes(gameType)) {
      return new Response(
        JSON.stringify({ error: 'نوع اللعبة غير صالح' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate trumpSuit for حكم mode
    if (gameType === 'حكم' && trumpSuit && !VALID_TRUMP_SUITS.includes(trumpSuit)) {
      return new Response(
        JSON.stringify({ error: 'نوع الحكم غير صالح' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'خطأ في إعدادات الخادم' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
      
      // Return generic error messages - don't reveal backend details
      let userMessage = 'حدث خطأ في معالجة الطلب';
      let statusCode = 500;
      
      if (response.status === 429) {
        userMessage = 'الخدمة مشغولة حالياً، حاول مرة أخرى';
        statusCode = 503;
      } else if (response.status === 402) {
        userMessage = 'الخدمة غير متاحة حالياً';
        statusCode = 503;
      }
      
      return new Response(
        JSON.stringify({ error: userMessage }),
        { status: statusCode, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    console.log('AI response received');

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
    // Log full details server-side only
    console.error('Error in analyze-cards function:', error);
    
    // Return generic error to client - never leak internal details
    return new Response(
      JSON.stringify({ error: 'حدث خطأ في الخادم' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
