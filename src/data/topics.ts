/**
 * Topic data for onboarding carousel
 * Maps available video content to user-friendly topic categories
 */

export interface Topic {
    id: string;
    icon: string;
    name: string;
    nameEn: string;
    description: string;
    suggestedQuestions: string[];
}

export const topics: Topic[] = [
    {
        id: "hiring",
        icon: "👥",
        name: "채용",
        nameEn: "Hiring",
        description: "첫 엔지니어, AE 채용 전략",
        suggestedQuestions: [
            "스타트업에서 첫 엔지니어를 어떻게 찾아야 하나요?",
            "초기 채용에서 가장 중요하게 봐야 할 기준은?",
            "엔지니어 면접에서 어떤 질문을 해야 하나요?",
        ],
    },
    {
        id: "sales",
        icon: "💰",
        name: "세일즈",
        nameEn: "Sales",
        description: "창업자 세일즈 전략",
        suggestedQuestions: [
            "창업자가 직접 세일즈를 어떻게 해야 하나요?",
            "B2B 첫 고객을 어떻게 확보하나요?",
            "세일즈 파이프라인을 어떻게 구축하나요?",
        ],
    },
    {
        id: "mvp",
        icon: "🚀",
        name: "MVP",
        nameEn: "MVP & Product",
        description: "최소 기능 제품 & Go-to-market",
        suggestedQuestions: [
            "MVP를 어떻게 만들어야 하나요?",
            "Go-to-market 전략은 어떻게 세우나요?",
            "첫 10명의 고객을 어떻게 찾나요?",
        ],
    },
    {
        id: "cofounder",
        icon: "🤝",
        name: "공동창업자",
        nameEn: "Co-Founder",
        description: "공동창업자 찾기와 협업",
        suggestedQuestions: [
            "공동창업자는 어떤 기준으로 찾아야 하나요?",
            "공동창업자 없이 시작해도 괜찮나요?",
            "공동창업자와 역할 분담은 어떻게 하나요?",
        ],
    },
    {
        id: "fundraising",
        icon: "💵",
        name: "펀드레이징",
        nameEn: "Fundraising",
        description: "투자 유치 전략과 YC 지원",
        suggestedQuestions: [
            "스타트업 펀드레이징은 어떻게 작동하나요?",
            "YC에 어떻게 지원하고 합격하나요?",
            "투자자에게 어떻게 피칭해야 하나요?",
        ],
    },
    {
        id: "growth",
        icon: "📈",
        name: "성장/지표",
        nameEn: "Growth & Metrics",
        description: "KPI 설정과 성장 전략",
        suggestedQuestions: [
            "스타트업 KPI는 어떻게 설정하나요?",
            "B2B/B2C 지표 중 뭘 봐야 하나요?",
            "사용자 리텐션은 어떻게 측정하나요?",
        ],
    },
];

/**
 * Video data for library preview - All 25 YC Startup School videos
 */
export interface VideoInfo {
    id: string; // YouTube Video ID
    title: string;
    speaker: string;
    thumbnail: string;
    category: string;
}

export const videos: VideoInfo[] = [
    // 01
    {
        id: "i_PjjXKNpA4",
        title: "Hiring Your First Engineers and AEs",
        speaker: "David Paffenholz",
        thumbnail: "https://img.youtube.com/vi/i_PjjXKNpA4/mqdefault.jpg",
        category: "Hiring"
    },
    // 02
    {
        id: "DH7REvnQ1y4",
        title: "The Sales Playbook For Founders",
        speaker: "Pete Koomen",
        thumbnail: "https://img.youtube.com/vi/DH7REvnQ1y4/mqdefault.jpg",
        category: "Sales"
    },
    // 03
    {
        id: "BJjsfNO5JTo",
        title: "How To Get The Most Out Of Vibe Coding",
        speaker: "YC Team",
        thumbnail: "https://img.youtube.com/vi/BJjsfNO5JTo/mqdefault.jpg",
        category: "Dev Tools"
    },
    // 04
    {
        id: "z1aKRhRnVNk",
        title: "How To Start A Dev Tools Company",
        speaker: "Nicolas Dessaigne",
        thumbnail: "https://img.youtube.com/vi/z1aKRhRnVNk/mqdefault.jpg",
        category: "Dev Tools"
    },
    // 05
    {
        id: "wH3TKpALlw4",
        title: "Key Terms You Should Know",
        speaker: "YC Team",
        thumbnail: "https://img.youtube.com/vi/wH3TKpALlw4/mqdefault.jpg",
        category: "Basics"
    },
    // 06
    {
        id: "Fk9BCr5pLTU",
        title: "How To Find A Co-Founder",
        speaker: "Harj Taggar",
        thumbnail: "https://img.youtube.com/vi/Fk9BCr5pLTU/mqdefault.jpg",
        category: "Co-Founder"
    },
    // 07
    {
        id: "7Kh_fpxP1yY",
        title: "How To Convert Customers With Cold Emails",
        speaker: "Aaron Epstein",
        thumbnail: "https://img.youtube.com/vi/7Kh_fpxP1yY/mqdefault.jpg",
        category: "Sales"
    },
    // 08
    {
        id: "VNxBZ7ka5J0",
        title: "How To Keep Your Users",
        speaker: "David Lieb",
        thumbnail: "https://img.youtube.com/vi/VNxBZ7ka5J0/mqdefault.jpg",
        category: "Growth"
    },
    // 09
    {
        id: "DISocTmEwiI",
        title: "Co-Founder Equity Mistakes to Avoid",
        speaker: "Michael Seibel",
        thumbnail: "https://img.youtube.com/vi/DISocTmEwiI/mqdefault.jpg",
        category: "Co-Founder"
    },
    // 10
    {
        id: "4hjiRmgmHiU",
        title: "How To Price For B2B",
        speaker: "Tom Blomfield",
        thumbnail: "https://img.youtube.com/vi/4hjiRmgmHiU/mqdefault.jpg",
        category: "Sales"
    },
    // 11
    {
        id: "0fKYVl12VTA",
        title: "Enterprise Sales",
        speaker: "Pete Koomen",
        thumbnail: "https://img.youtube.com/vi/0fKYVl12VTA/mqdefault.jpg",
        category: "Sales"
    },
    // 12
    {
        id: "fdD4y4Civp4",
        title: "Consumer Startup Metrics",
        speaker: "Tom Blomfield",
        thumbnail: "https://img.youtube.com/vi/fdD4y4Civp4/mqdefault.jpg",
        category: "Metrics"
    },
    // 13
    {
        id: "_mKeVGSqQac",
        title: "B2B Startup Metrics",
        speaker: "Tom Blomfield",
        thumbnail: "https://img.youtube.com/vi/_mKeVGSqQac/mqdefault.jpg",
        category: "Metrics"
    },
    // 14
    {
        id: "6DTK9yDP6p0",
        title: "Setting KPIs and Goals",
        speaker: "Adora Cheung",
        thumbnail: "https://img.youtube.com/vi/6DTK9yDP6p0/mqdefault.jpg",
        category: "Growth"
    },
    // 15
    {
        id: "B5tU2447OK8",
        title: "How to Apply And Succeed at YC",
        speaker: "Dalton Caldwell",
        thumbnail: "https://img.youtube.com/vi/B5tU2447OK8/mqdefault.jpg",
        category: "Fundraising"
    },
    // 16
    {
        id: "rP7bpYsfa6Q",
        title: "Tips For Technical Startup Founders",
        speaker: "Diana Hu",
        thumbnail: "https://img.youtube.com/vi/rP7bpYsfa6Q/mqdefault.jpg",
        category: "Basics"
    },
    // 17
    {
        id: "zBUhQPPS9AY",
        title: "How Startup Fundraising Works",
        speaker: "Brad Flora",
        thumbnail: "https://img.youtube.com/vi/zBUhQPPS9AY/mqdefault.jpg",
        category: "Fundraising"
    },
    // 18
    {
        id: "QRZ_l7cVzzU",
        title: "How to Build An MVP",
        speaker: "Michael Seibel",
        thumbnail: "https://img.youtube.com/vi/QRZ_l7cVzzU/mqdefault.jpg",
        category: "Product"
    },
    // 19
    {
        id: "u36A-YTxiOw",
        title: "The Best Way To Launch Your Startup",
        speaker: "Kat Mañalac",
        thumbnail: "https://img.youtube.com/vi/u36A-YTxiOw/mqdefault.jpg",
        category: "Growth"
    },
    // 20
    {
        id: "A4SLDQDXdp0",
        title: "Keys To Successful Co-Founder Relationships",
        speaker: "Ali Rowghani",
        thumbnail: "https://img.youtube.com/vi/A4SLDQDXdp0/mqdefault.jpg",
        category: "Co-Founder"
    },
    // 21
    {
        id: "hyYCn_kAngI",
        title: "How to Get Your First Customers",
        speaker: "Gustaf Alströmer",
        thumbnail: "https://img.youtube.com/vi/hyYCn_kAngI/mqdefault.jpg",
        category: "Growth"
    },
    // 22
    {
        id: "oWZbWzAyHAE",
        title: "Startup Business Models and Pricing",
        speaker: "Aaron Epstein",
        thumbnail: "https://img.youtube.com/vi/oWZbWzAyHAE/mqdefault.jpg",
        category: "Sales"
    },
    // 23
    {
        id: "z1iF1c8w5Lg",
        title: "How To Talk To Users",
        speaker: "Gustaf Alströmer",
        thumbnail: "https://img.youtube.com/vi/z1iF1c8w5Lg/mqdefault.jpg",
        category: "Product"
    },
    // 24
    {
        id: "Th8JoIan4dg",
        title: "How to Get and Evaluate Startup Ideas",
        speaker: "Jared Friedman",
        thumbnail: "https://img.youtube.com/vi/Th8JoIan4dg/mqdefault.jpg",
        category: "Idea"
    },
    // 25
    {
        id: "BUE-icVYRFU",
        title: "Should You Start A Startup?",
        speaker: "Jared Friedman",
        thumbnail: "https://img.youtube.com/vi/BUE-icVYRFU/mqdefault.jpg",
        category: "Basics"
    }
];
