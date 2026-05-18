<?php

namespace Database\Seeders;

use App\Models\QMR\RiskRegister;
use App\Models\QMR\RiskKpi;
use App\Models\QMR\RiskControl;
use Illuminate\Database\Seeder;

class QmrRiskSeeder extends Seeder
{
    public function run(): void
    {
        $risks = [
            [
                'code' => 'RSK-QP-001',
                'document_title' => 'เอกสารระบบคุณภาพทบทวนไม่ทันรอบตรวจ',
                'consideration' => 'การทบทวน Procedure / WI ล่าช้า อาจทำให้ข้อมูลควบคุมไม่เป็นปัจจุบัน',
                'expectation' => 'เอกสารทุกฉบับได้รับการทบทวนตามรอบที่กำหนด',
                'risk_category' => 'Compliance',
                'owner_name' => 'หัวหน้าฝ่ายแผนพัฒนาคุณภาพ',
                'risk_likelihood' => 4,
                'risk_impact' => 4,
                'improvement_likelihood' => 2,
                'improvement_impact' => 2,
                'status' => 'active',
            ],
            [
                'code' => 'RSK-QP-002',
                'document_title' => 'KPI โครงการปรับปรุงคุณภาพไม่บรรลุเป้าหมาย',
                'consideration' => 'ติดตามผลล่าช้า ทำให้ไม่มีสัญญาณเตือนก่อนครบกำหนด',
                'expectation' => 'โครงการปรับปรุงบรรลุเป้าหมายตามแผน',
                'risk_category' => 'Strategic',
                'owner_name' => 'QMR Coordinator',
                'risk_likelihood' => 3,
                'risk_impact' => 3,
                'improvement_likelihood' => 2,
                'improvement_impact' => 2,
                'status' => 'active',
            ],
            [
                'code' => 'RSK-QP-003',
                'document_title' => 'ข้อมูลรายงานความเสี่ยงจากหน่วยงานไม่ครบถ้วน',
                'consideration' => 'ข้อมูลที่ส่งเข้าฝ่ายแผนพัฒนาคุณภาพไม่ครบตามแบบฟอร์มกลาง',
                'expectation' => 'ได้รับข้อมูลที่ถูกต้องและครบถ้วนจากทุกหน่วยงาน',
                'risk_category' => 'Operation',
                'owner_name' => 'ทีมวิเคราะห์ระบบคุณภาพ',
                'risk_likelihood' => 4,
                'risk_impact' => 3,
                'improvement_likelihood' => 2,
                'improvement_impact' => 3,
                'status' => 'active',
            ],
        ];

        foreach ($risks as $riskData) {
            $risk = RiskRegister::updateOrCreate(
                ['code' => $riskData['code']],
                $riskData
            );

            // Add a KPI for each risk
            RiskKpi::updateOrCreate(
                ['code' => 'KPI-' . $risk->code],
                [
                    'risk_register_id' => $risk->id,
                    'name' => 'ประสิทธิผลของมาตรการสำหรับ ' . $risk->code,
                    'target_value' => 100,
                    'current_value' => rand(80, 100),
                    'status' => 'met',
                ]
            );

            // Add a Control for each risk
            RiskControl::updateOrCreate(
                ['code' => 'CTRL-' . $risk->code],
                [
                    'risk_register_id' => $risk->id,
                    'name' => 'มาตรการควบคุมสำหรับ ' . $risk->code,
                    'status' => 'active',
                    'progress_percent' => rand(50, 100),
                ]
            );
        }
    }
}
