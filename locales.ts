export const translations = {
    chat: {
        placeholder: { en: "Message {{name}}...", ar: "راسل {{name}}..." },
        // Settings & Actions
        settings: { en: "Settings", ar: "الإعدادات" },
        newChat: { en: "New Chat", ar: "محادثة جديدة" },
        initialMessage: { en: "Hello! I'm {{name}}, your personal AI companion. How can I help you today?", ar: "هلا والله. أنا '{{name}}'، رفيقك الذكي. سم، وش بغيت؟" },
        untitledChat: { en: "New Chat", ar: "محادثة جديدة" },
        deleteConvoConfirm: { en: "Are you sure you want to delete this conversation?", ar: "هل أنت متأكد من رغبتك في حذف هذه المحادثة؟" },

        // Edit messages
        editMessages: { en: "Edit Messages", ar: "تعديل الرسائل" },
        deleteSelected: { en: "Delete Selected", ar: "حذف المحدد" },
        deleteSelectedPrompt: { en: "Delete {{count}} selected messages?", ar: "حذف {{count}} من الرسائل المحددة؟" },
        done: { en: "Done", ar: "تم" },

        // Dev Mode
        devMode: { en: "Developer Tools", ar: "أدوات المطور" },
        impersonate: { en: "Impersonate Mode", ar: "وضع المحاكاة" },
        impersonateActive: { en: "Impersonation mode is active.", ar: "وضع المحاكاة فعال." },
        viewSystemPrompt: { en: "View {{name}}'s Prompt", ar: "عرض عقل {{name}}" },
        editMessage: { en: "Edit Message", ar: "تعديل الرسالة" },
        save: { en: "Save", ar: "حفظ" },
        modelSettings: { en: "Model Settings", ar: "إعدادات النموذج" },
        temperature: { en: "Creativity (Temperature)", ar: "الإبداع" },
        topP: { en: "Focus (Top-P)", ar: "التركيز" },
        resetApp: { en: "Reset App", ar: "إعادة ضبط التطبيق" },
        resetAppConfirm: { en: "Are you sure? This will delete all conversations.", ar: "هل أنت متأكد؟ سيتم حذف جميع المحادثات." },

        
        // New Features
        reviewFile: { en: "Review a File", ar: "مراجعة ملف" },
        designImage: { en: "Design an Image", ar: "تصميم صورة" },
        designLogo: { en: "Design a Logo", ar: "تصميم شعار" },
        generateCode: { en: "Generate Code", ar: "كتابة كود" },
        summarize: { en: "Summarize Conversation", ar: "تلخيص المحادثة" },
        summarizing: { en: "Summarizing the conversation...", ar: "جاري تلخيص المحادثة..." },
        textReviewing: { en: "Reviewing file:", ar: "جاري مراجعة ملف:" },
        codeReviewing: { en: "Analyzing source code:", ar: "جاري تحليل الكود:" },
        imageGenerating: { en: "Designing your image...", ar: "جاري تصميم صورتك..." },
        logoGenerating: { en: "Designing your logo...", ar: "جاري تصميم شعارك..." },
        codeGenerating: { en: "Writing your code...", ar: "جاري كتابة الكود..." },
        copyCode: { en: "Copy Code", ar: "نسخ الكود" },
        codeCopied: { en: "Copied!", ar: "تم النسخ!" },
        
        // Theme
        theme: { en: "Theme", ar: "المظهر" },
        earthy: { en: "Earthy", ar: "ترابي" },
        purple: { en: "Purple", ar: "بنفسجي" },
        
        // Persona
        persona: {
            title: { en: "Persona", ar: "الشخصية" },
            male: { en: "Jaml (Male)", ar: "جمل (ذكر)" },
            female: { en: "Naqa (Female)", ar: "ناقة (أنثى)" },
        },
        
        // Errors
        error: { en: "Sorry, something went wrong.", ar: "عذرًا، حدث خطأ ما." },
        fileReadError: { en: "Sorry, I couldn't read that file.", ar: "عذرًا، لم أتمكن من قراءة هذا الملف." },
        imagePolicyError: { en: "Sorry, I cannot create this image due to my content policy. This often includes generating images of real people.", ar: "عذرًا، لا يمكنني إنشاء هذه الصورة بسبب سياسة المحتوى الخاصة بي. غالبًا ما يتضمن ذلك إنشاء صور لأشخاص حقيقيين." },
        logoPolicyError: { en: "Sorry, I cannot create this logo due to my content policy.", ar: "عذرًا، لا يمكنني إنشاء هذا الشعار بسبب سياسة المحتوى الخاصة بي." },
        warning1Message: { en: "This is your first warning. Please maintain a respectful conversation.", ar: "هذا تحذيرك الأول. الرجاء الحفاظ على حوار محترم." },
        warning2Message: { en: "This is your final warning. Any further inappropriate language will result in a temporary ban.", ar: "هذا تحذيرك الأخير. أي لغة غير لائقة أخرى ستؤدي إلى حظر مؤقت." },
        banMessage: { en: "You have been temporarily banned due to inappropriate language.", ar: "لقد تم حظرك مؤقتًا بسبب استخدام لغة غير لائقة." },
        banTimeRemaining: { en: "Time remaining", ar: "الوقت المتبقي" },

        // New Features in ChatScreen
        thinkingMode: { en: "Deep Thinking", ar: "تفكير عميق" },
        thinkingModeTooltip: { en: "AI will think more deeply before answering.", ar: "سيفكر الذكاء الاصطناعي بعمق أكبر قبل الإجابة." },
        attachment: { en: "Attach", ar: "إرفاق" },
        designOrEditImage: { en: "Design/Edit Image", ar: "تصميم أو تعديل صورة" },
        solveHomework: { en: "Solve Homework (Image)", ar: "حل واجب (من صورة)" },
        download: { en: "Download", ar: "تحميل" },
        edit: { en: "Edit", ar: "تعديل" },
        homeworkPrompt: { en: "Please solve the questions in the image.", ar: "الرجاء حل الأسئلة الموجودة في الصورة."},
        beta: { en: "BETA", ar: "بيتا" }
    },
    onboarding: {
        welcomeTitle: { en: "Welcome to {{name}}!", ar: "أهلاً بك في {{name}}!" },
        welcomeDescription: { 
            en: "I'm not just code; I'm your smart companion, born from Arabic culture and technology to be your perfect personal assistant.", 
            ar: "أنا لست مجرد كود، أنا رفيقك الذكي. وُلدت من رحم الثقافة العربية والتكنولوجيا لأكون مساعدك الشخصي المثالي." 
        },
        featuresTitle: { en: "What Can I Do?", ar: "ماذا أستطيع أن أفعل؟" },
        featuresDescription: { 
            en: "From casual chats to complex tasks, I'm here to help you with anything you need.", 
            ar: "من الدردشة العادية إلى المهام المعقدة، أنا هنا لمساعدتك في كل ما تحتاجه." 
        },
        featureChat: { en: "General Chat", ar: "دردشة عامة" },
        featureDesign: { en: "Design & Edit", ar: "تصميم وتعديل" },
        featureCode: { en: "Write Code", ar: "كتابة الأكواد" },
        featureReview: { en: "Review Files", ar: "مراجعة الملفات" },
        tipsTitle: { en: "Pro Tips", ar: "نصائح احترافية" },
        tipsDescription: { 
            en: "Get the most out of me with these powerful features.", 
            ar: "استفد مني إلى أقصى حد مع هذه الميزات القوية." 
        },
        tipAttachTitle: { en: "Unified Attachment Menu", ar: "قائمة الإرفاق الموحدة" },
        tipAttachDescription: { en: "Use the paperclip icon to design images, review files, or solve homework from a photo.", ar: "استخدم أيقونة مشبك الورق لتصميم الصور، مراجعة الملفات، أو حتى حل الواجبات من صورة." },
        tipDeepThinkingTitle: { en: "Deep Thinking Mode", ar: "وضع التفكير العميق" },
        tipDeepThinkingDescription: { en: "Toggle the brain icon to get more detailed and analytical answers for complex topics.", ar: "فعّل أيقونة العقل للحصول على إجابات أكثر تفصيلاً وتحليلاً للمواضيع المعقدة." },
        tipImageInteractionTitle: { en: "Interact with Images", ar: "تفاعل مع الصور" },
        tipImageInteractionDescription: { en: "Hover over any image I create to find options to download or edit it instantly.", ar: "مرر الفأرة فوق أي صورة أقوم بإنشائها لتجد خيارات لتحميلها أو تعديلها على الفور." },
        nextButton: { en: "Next", ar: "التالي" },
        startButton: { en: "Get Started", ar: "ابدأ الآن" },
    },
    setup: {
        title: { en: "Choose Your Companion", ar: "اختر رفيقك" },
        description: { en: "Select the personality you'd like to interact with.", ar: "اختر الشخصية التي تود التفاعل معها." },
        male: { en: "Jaml", ar: "جمل" },
        female: { en: "Naqa", ar: "ناقة" },
    }
};
