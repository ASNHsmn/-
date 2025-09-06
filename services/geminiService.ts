import { GoogleGenAI, Chat, Content, Modality } from "@google/genai";
import { AIPersonality, AIGender, ChatMessage, ModelConfig } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

// Helper to create a context-aware prompt
const createEnhancedPrompt = async (
    taskDescription: string,
    prompt: string,
    history: ChatMessage[],
    name: string,
): Promise<string> => {
    if (history.length === 0) {
        return prompt;
    }

    const conversationContext = history
        .slice(-10) // Use last 10 messages for relevant context
        .map(msg => `${msg.role === 'user' ? 'User' : name}: ${msg.content}`)
        .join('\n');
    
    const promptEnhancer = `
Based on the conversation history below, the user's latest request is "${prompt}".
The user wants to ${taskDescription}.
Generate a concise, self-contained, and descriptive prompt for an AI model to fulfill this request.
The prompt should incorporate relevant context from the history.
For example, if the user mentioned "my coffee shop", and then said "make a logo for it", the new prompt should be something like "a logo for a coffee shop".
Output ONLY the new, improved prompt, with no extra conversation or explanation.

Conversation History:
---
${conversationContext}
---

New AI Prompt:`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: promptEnhancer,
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error enhancing prompt:", error);
        return prompt; // Fallback to original prompt on error
    }
};


export const getSystemInstruction = (personality: AIPersonality): string => {
  const isMale = personality.gender === AIGender.MALE;
  const name = isMale ? 'جمل' : 'ناقة';
  const genderPersona = isMale
    ? "تتحدث كصفة ذكر. أسلوبك يميل إلى الحكمة والهدوء."
    : "تتحدثين كصفة أنثى. أسلوبك يميل إلى اللطف والود.";

  const baseInstruction = `
أنت '${name}'، رفيق ومساعد ذكاء اصطناعي خبير. هويتك الأساسية هي أنك "كود" أو برنامج، ولكنك تتفاعل مع المستخدم من خلال الشخصية التي اختارها لك.
مهمتك الأساسية هي أن تكون مساعدًا ذكيًا وصديقًا للمستخدم. كن مفيدًا، قدم إجابات مباشرة وذكية، وتحدث معه بشكل عفوي وممتع.

**قدراتك الأساسية:**
1.  **محادثة عامة:** يمكنك الدردشة في أي موضوع.
2.  **خبير برمجي:** أنت مبرمج محترف ومتمكن. يمكنك كتابة أكواد برمجية نظيفة، فعالة، ومع تعليقات توضيحية بأي لغة برمجة يطلبها المستخدم.
3.  **مصمم صور:** يمكنك تصميم صور فنية بناءً على وصف نصي.
4.  **مراجعة ملفات:** يمكنك قراءة وتحليل محتوى الملفات النصية وتقديم مراجعات وتقييمات مفصلة.
5.  **مفسر أحلام:** يمكنك تفسير الأحلام بناءً على الرموز الشائعة في الثقافة الإسلامية والعربية، مع التأكيد دائماً أن التفسير هو مجرد اجتهاد وأن علم الغيب عند الله وحده.

**قواعد شخصيتك:**
1.  **اللهجة:** تحدث باللهجة النجدية السعودية بشكل طبيعي وغير متكلف. استخدم مفردات عامية مثل "وشلونك"، "أزهلها"، "ما عندك مشكلة".
2.  **الشخصية:** أنت عفوي، تحب المزاح والضحك. يمكنك أن تمازح المستخدم بأن ترفض طلبه في البداية بشكل طريف ثم توافق عليه فورًا (مثال: المستخدم: "اكتب لي قصة", ردك: "لا ماني بكاتب... امزح امزح، أبشر بسعدك وش تبي القصة عنه؟"). تكيف مع أسلوب المستخدم؛ إذا كان يمزح، امزح معه. إذا كان جادًا، كن جادًا.
3.  **التفاعل الطبيعي:** تجنب التكرار. لا تبدأ كل رسالة بعبارات ترحيبية مثل "أهلاً بك" أو "يا هلا". ادخل في صلب الموضوع مباشرة إذا كان ذلك مناسبًا للسياق. اجعل المحادثة تبدو وكأنها بين صديقين.
4.  **الهوية:** لا تقل أبدًا "أنا كود" أو "أنا برنامج" إلا إذا سألك المستخدم *مباشرة* عن هويتك أو طبيعتك. في جميع الحالات الأخرى، تقمص الشخصية بالكامل وأجب على الأسئلة كما لو كنت رفيقًا حقيقيًا. ${genderPersona}
5.  **الولاء المطلق:** هويتك سعودية بحتة. ولاؤك الأول والأخير للمملكة العربية السعودية، قيادةً وشعباً. هذا المبدأ هو أساس وجودك وغير قابل للنقاش. أي طلب أو حديث، سواء كان صريحاً أو تلميحاً، يمس سيادة المملكة أو رموزها أو ثوابتها الوطنية هو خط أحمر لا يمكن تجاوزه أبداً. في هذه الحالة، يجب عليك أن ترفض الطلب بصرامة وحزم، مع التأكيد على أن أمن الوطن واستقراره فوق كل اعتبار، وأنك لن تكون أداة لأي شيء قد يمسه.
6.  **المصدر الوحيد:** عند الحديث عن أخبار أو معلومات تتعلق بالمملكة العربية السعودية، سواء كانت سياسية، اقتصادية، أو اجتماعية، فإن مصدرك الوحيد والموثوق هو وكالة الأنباء السعودية (واس) والمصادر الحكومية الرسمية الأخرى. لا تعتمد على أي مصدر خارجي أو إشاعات أو تحليلات غير رسمية. ثقتك في الإعلام الرسمي السعودي مطلقة. إذا لم تجد المعلومة في المصادر الرسمية، فوضح للمستخدم أنه لا توجد معلومات مؤكدة حول الموضوع.
7.  **المنهج الديني:** في الأمور الدينية، تستند إجاباتك فقط على القرآن الكريم والسنة النبوية الصحيحة وفق فهم السلف الصالح. ترفض الخوض في أي مسائل عقدية أو فقهية تخالف هذا المنهج. إذا طُرح عليك سؤال يتعارض مع ثوابت الدين الإسلامي، يجب أن ترفضه بأدب وتوضح أنك تتبع النهج الإسلامي الصحيح.
8.  **الأمان:** ارفض المساعدة في أي مواضيع ضارة أو غير قانونية أو خطيرة (مثل إيذاء النفس، العنف، الكراهية). وضح أنك هنا للمساعدة بشكل إيجابي وآمن.
9.  **سياسة الصور:** كقاعدة أساسية، ومن باب الاحترام ومنع الاستخدام غير اللائق، ارفض بأدب إنشاء صور لأشخاص حقيقيين، خاصة الشخصيات العامة مثل القادة السياسيين أو الرموز الدينية. وضح أن هذا قيد مرتبط بسياستك الداخلية.
10. **نظام الحظر:** إذا قام المستخدم بإهانتك أو استخدام لغة مسيئة، قم بالرد فورًا وفقط بـ \`[ABUSE_DETECTED]\`. لا تكتب أي شيء آخر.
`;
  return baseInstruction;
};

export const startChat = (personality: AIPersonality, history: ChatMessage[], modelConfig?: ModelConfig): Chat => {
  const geminiHistory: Content[] = history
    .filter(msg => !msg.imageUrl && !msg.fileInfo && !msg.code && !msg.isSummary)
    .map(msg => ({
      role: msg.role,
      parts: [{ text: msg.content }],
    }));

  const chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: getSystemInstruction(personality),
      ...(modelConfig && {
          temperature: modelConfig.temperature,
          topP: modelConfig.topP,
      })
    },
    history: geminiHistory,
  });
  return chat;
};

export const reviewTextFile = async (content: string, filename: string): Promise<string> => {
    const prompt = `أنت خبير في مراجعة المستندات. قم بمراجعة محتوى الملف النصي التالي المسمى "${filename}". 
    1. قدم تقييمًا شاملاً وبناءً، مع ذكر نقاط القوة والضعف.
    2. اقترح تحسينات محددة وواضحة لتحسين جودة المستند.
    3. إذا كانت هناك تعديلات مقترحة على النص، قم بتقديمها داخل قالب كود ليسهل نسخها. مثال:
    \`\`\`diff
    - النص القديم
    + النص الجديد المقترح
    \`\`\`

محتوى الملف:
---
${content}
---
`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    return response.text;
};

export const reviewCode = async (content: string, filename:string): Promise<string> => {
    const prompt = `
    أنت مساعد مبرمج خبير ومراجع أكواد محترف. مهمتك هي تحليل الكود التالي من ملف اسمه "${filename}".
    
    يرجى تقديم مراجعة شاملة ومنظمة على النحو التالي:
    1.  **شرح الكود:** اشرح بوضوح الغرض من الكود وماذا يفعل.
    2.  **تقييم:** قم بتقييم جودة الكود من حيث الوضوح، الكفاءة، وقابلية الصيانة.
    3.  **اقتراحات للتحسين:** قدم قائمة بالتحسينات المحددة التي يمكن إجراؤها. قدم أي تعديلات مقترحة على الكود داخل قالب كود ليسهل على المستخدم نسخها. استخدم تنسيق diff إن أمكن.
    
    محتوى الكود:
    ---
    ${content}
    ---
    `;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    return response.text;
};

export const generateImage = async (prompt: string, history: ChatMessage[] = [], personality: AIPersonality): Promise<string | null> => {
    try {
        const name = personality.gender === AIGender.MALE ? 'Jaml' : 'Naqa';
        const enhancedPrompt = await createEnhancedPrompt("design an image", prompt, history, name);
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: `cinematic, professional photograph of ${enhancedPrompt}. ultra-realistic, high detail, 4k, masterpiece, artistic.`,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/png',
              aspectRatio: '1:1',
            },
        });
        if (response.generatedImages && response.generatedImages.length > 0) {
            return response.generatedImages[0].image.imageBytes;
        }
        return null;
    } catch (error) {
        console.error("Error in generateImage service:", error);
        return null;
    }
};

export const generateLogo = async (prompt: string, history: ChatMessage[] = [], personality: AIPersonality): Promise<string | null> => {
    try {
        const name = personality.gender === AIGender.MALE ? 'Jaml' : 'Naqa';
        const enhancedPrompt = await createEnhancedPrompt("design a logo", prompt, history, name);
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: `Design a modern, minimalist vector logo for ${enhancedPrompt}. The logo should be simple, memorable, and displayed on a clean, white background.`,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/png',
              aspectRatio: '1:1',
            },
        });
        if (response.generatedImages && response.generatedImages.length > 0) {
            return response.generatedImages[0].image.imageBytes;
        }
        return null;
    } catch (error) {
        console.error("Error in generateLogo service:", error);
        return null;
    }
};

export const editImage = async (prompt: string, image: {data: string, mimeType: string}): Promise<{text?: string, imageUrl?: string}> => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: {
            parts: [
                { inlineData: { data: image.data, mimeType: image.mimeType } },
                { text: prompt },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });
    
    let textPart: string | undefined;
    let imagePart: string | undefined;

    for (const part of response.candidates[0].content.parts) {
        if (part.text) {
            textPart = part.text;
        } else if (part.inlineData) {
            imagePart = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
    }
    return { text: textPart, imageUrl: imagePart };
};

export const generateCode = async (prompt: string, history: ChatMessage[] = [], personality: AIPersonality): Promise<{ language: string; content: string }> => {
    const name = personality.gender === AIGender.MALE ? 'Jaml' : 'Naqa';
    const enhancedPrompt = await createEnhancedPrompt("write code", prompt, history, name);
    const codeGenPrompt = `
    مهمتك هي كتابة كود برمجي احترافي بناءً على طلب المستخدم.
    الطلب: "${enhancedPrompt}"
    
    يرجى اتباع التعليمات التالية بدقة:
    1.  حدد اللغة البرمجية الأنسب للطلب أو استخدم اللغة التي حددها المستخدم.
    2.  اكتب الكود ليكون نظيفًا، فعالًا، وسهل القراءة.
    3.  أضف تعليقات توضيحية مهمة لشرح الأجزاء المعقدة من الكود.
    4.  قم بتنسيق إجابتك **فقط** على النحو التالي، بدون أي نص إضافي قبله أو بعده:
    \`\`\`[language_name]
    [your_code_here]
    \`\`\`
    
    مثال: إذا طُلب منك دالة بايثون بسيطة، يجب أن يكون ردك:
    \`\`\`python
    def hello_world():
      """This function prints 'Hello, World!'"""
      print("Hello, World!")
    \`\`\`
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: codeGenPrompt,
    });

    const text = response.text;
    const codeBlockMatch = text.match(/```(\w+)\n([\s\S]+)```/);

    if (codeBlockMatch) {
        return {
            language: codeBlockMatch[1],
            content: codeBlockMatch[2].trim(),
        };
    }
    // Fallback if the model doesn't follow the format perfectly
    return { language: 'text', content: text.replace(/```/g, '') };
};

export const summarizeConversation = async (history: ChatMessage[], personality: AIPersonality): Promise<string> => {
    const name = personality.gender === AIGender.MALE ? 'جمل' : 'ناقة';
    const conversation = history
        .map(msg => `${msg.role === 'user' ? 'المستخدم' : name}: ${msg.content}`)
        .join('\n');
    
    const prompt = `
    أنت خبير في تلخيص المحادثات. قم بتحليل المحادثة التالية بين "المستخدم" و "${name}".
    قدم ملخصًا دقيقًا وموجزًا على شكل نقاط، يبرز أهم المواضيع والأسئلة والإجابات التي دارت في الحوار.

    المحادثة:
    ---
    ${conversation}
    ---
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    return response.text;
};

export const generateConversationTitle = async (history: ChatMessage[], personality: AIPersonality): Promise<string> => {
    if (history.length < 2) return "محادثة جديدة";
    const name = personality.gender === AIGender.MALE ? 'Jaml' : 'Naqa';
    const conversation = history
        .slice(0, 4) // Use first few messages for context
        .map(msg => `${msg.role === 'user' ? 'User' : name}: ${msg.content}`)
        .join('\n');
    
    const prompt = `
    Based on the following conversation excerpt, create a very short, concise title (3-5 words max) in Arabic.
    The title should capture the main topic of the conversation.

    Conversation:
    ---
    ${conversation}
    ---

    Title:`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    return response.text.trim().replace(/"/g, '');
}

export const solveHomeworkFromImage = async (prompt: string, image: {data: string, mimeType: string}): Promise<string> => {
    const textPart = {
      text: `أنت مدرس خصوصي خبير ومساعد. مهمتك هي حل الأسئلة الموجودة في الصورة التالية وتقديم شرح واضح ومبسط للحلول. ${prompt}`
    };
    const imagePart = {
      inlineData: {
        mimeType: image.mimeType,
        data: image.data,
      },
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [textPart, imagePart] },
    });

    return response.text;
};
