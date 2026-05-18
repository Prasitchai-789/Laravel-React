export type RiskLevelCode = 'H' | 'M' | 'L';
export type RiskLevelName = 'สูงมาก' | 'ปานกลาง' | 'ต่ำ';

export type RiskLevelDefinition = {
    code: RiskLevelCode;
    name: RiskLevelName;
    range: string;
    min: number;
    max: number;
    color: string;
    textClass: string;
    bgClass: string;
    borderClass: string;
    gradientClass: string;
    description: string;
};

export type RiskAnalysisResult = RiskLevelDefinition & {
    likelihood: number;
    impact: number;
    score: number;
};

export const RISK_LEVEL_DEFINITIONS: RiskLevelDefinition[] = [
    {
        code: 'H',
        name: 'สูงมาก',
        range: '13-25',
        min: 13,
        max: 25,
        color: '#ef4444',
        textClass: 'text-red-700',
        bgClass: 'bg-red-50',
        borderClass: 'border-red-200',
        gradientClass: 'from-red-500 to-red-600',
        description:
            'ระดับความเสี่ยงอยู่ในระดับสูงมาก หรือช่วงคะแนน 13-25 คะแนน ต้องมีการกำกับดูแลอย่างใกล้ชิด และต้องบริหารจัดการความเสี่ยงทันที โดยผู้จัดการฝ่ายที่เกี่ยวข้องเป็นผู้รับผิดชอบกำหนดแนวทาง วิธีการจัดการ กำจัด หรือลดความเสี่ยง รวมถึงจัดทำแผนงานโครงการจัดการความเสี่ยงในแบบฟอร์ม Action Plan โดยให้ QMR ทบทวนและพิจารณาอนุมัติ หรือกรรมการผู้จัดการเป็นผู้อนุมัติ',
    },
    {
        code: 'M',
        name: 'ปานกลาง',
        range: '5-12',
        min: 5,
        max: 12,
        color: '#eab308',
        textClass: 'text-amber-700',
        bgClass: 'bg-amber-50',
        borderClass: 'border-amber-200',
        gradientClass: 'from-yellow-300 to-amber-400',
        description:
            'ระดับความเสี่ยงอยู่ในระดับปานกลาง หรือช่วงคะแนน 5-12 คะแนน ไม่ต้องจัดทำแผนการจัดการความเสี่ยง แต่ต้องเฝ้าติดตามความเสี่ยงอย่างต่อเนื่อง โดยผู้บริหารระดับสูงและผู้แทนฝ่ายบริหารคุณภาพเข้าสู่การติดตามงานในวาระประชุมฝ่ายบริหาร',
    },
    {
        code: 'L',
        name: 'ต่ำ',
        range: '1-4',
        min: 1,
        max: 4,
        color: '#22c55e',
        textClass: 'text-emerald-700',
        bgClass: 'bg-emerald-50',
        borderClass: 'border-emerald-200',
        gradientClass: 'from-lime-400 to-green-500',
        description:
            'ระดับความเสี่ยงอยู่ในระดับต่ำ หรือช่วงคะแนน 1-4 คะแนน ไม่ต้องจัดทำแผนการควบคุมความเสี่ยง แต่พยายามรักษาระดับไว้ให้อยู่ในกลุ่มนี้ตลอดไป แม้ว่าสภาพแวดล้อม ระบบการบริหารงาน หรือการเปลี่ยนแปลงในอนาคตจะเปลี่ยนไป โดยผู้บริหารระดับสูงและผู้แทนฝ่ายบริหารคุณภาพเป็นผู้ติดตาม',
    },
];

export const calculateRiskScore = (likelihood: number, impact: number) => likelihood * impact;

export const getRiskLevelByScore = (score: number): RiskLevelDefinition => {
    return RISK_LEVEL_DEFINITIONS.find((level) => score >= level.min && score <= level.max) ?? RISK_LEVEL_DEFINITIONS[2];
};

export const analyzeRisk = (likelihood: number, impact: number): RiskAnalysisResult => {
    const score = calculateRiskScore(likelihood, impact);
    return {
        ...getRiskLevelByScore(score),
        likelihood,
        impact,
        score,
    };
};
