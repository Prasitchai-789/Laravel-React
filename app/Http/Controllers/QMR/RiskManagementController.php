<?php

namespace App\Http\Controllers\QMR;

use App\Http\Controllers\Controller;
use App\Models\QMR\RiskControl;
use App\Models\QMR\RiskKpi;
use App\Models\QMR\RiskRegister;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class RiskManagementController extends Controller
{
    public function index(): Response
    {
        $risks = RiskRegister::query()
            ->select([
                'id',
                'code',
                'document_title',
                'consideration',
                'risk_category',
                'owner_name',
                'risk_level',
                'risk_likelihood',
                'risk_impact',
                'improvement_likelihood',
                'improvement_impact',
                'risk_score',
                'created_at',
            ])
            ->latest()
            ->limit(100)
            ->get()
            ->map(fn ($risk) => [
                'id' => $risk->code,
                'db_id' => $risk->id,
                'title' => $risk->document_title,
                'detail' => $risk->consideration,
                'category' => $risk->risk_category,
                'owner' => $risk->owner_name,
                'level' => $this->mapLevelName($risk->risk_level),
                'likelihood' => $risk->risk_likelihood,
                'impact' => $risk->risk_impact,
                'residualLikelihood' => $risk->improvement_likelihood,
                'residualImpact' => $risk->improvement_impact,
                'score' => $risk->risk_score,
            ]);

        $riskLevelCounts = RiskRegister::query()
            ->select('risk_level', DB::raw('count(*) as total'))
            ->groupBy('risk_level')
            ->pluck('total', 'risk_level');

        $levelChart = [
            ['name' => 'ต่ำ', 'value' => (int) ($riskLevelCounts['L'] ?? 0)],
            ['name' => 'ปานกลาง', 'value' => (int) ($riskLevelCounts['M'] ?? 0)],
            ['name' => 'สูงมาก', 'value' => (int) ($riskLevelCounts['H'] ?? 0) + (int) ($riskLevelCounts['VH'] ?? 0)],
        ];

        $categoryChart = RiskRegister::select('risk_category', DB::raw('count(*) as value'))
            ->groupBy('risk_category')
            ->get()
            ->map(fn ($item) => [
                'name' => match ($item->risk_category) {
                    'Operation' => 'การดำเนินงาน',
                    'Strategic' => 'กลยุทธ์',
                    'Compliance' => 'กฎระเบียบ',
                    default => $item->risk_category ?: 'อื่นๆ'
                },
                'value' => $item->value,
                'color' => match ($item->risk_category) {
                    'Operation' => '#2563eb', // Blue
                    'Strategic' => '#7c3aed', // Purple
                    'Compliance' => '#10b981', // Emerald
                    default => '#64748b'
                },
            ]);

        $kpiStatusCounts = RiskKpi::query()
            ->select('status', DB::raw('count(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');

        $kpiStatus = [
            ['label' => 'Met - เข้าเป้า', 'value' => (int) ($kpiStatusCounts['met'] ?? 0), 'color' => 'text-emerald-300', 'bg' => 'bg-emerald-400/10', 'border' => 'border-emerald-400/30'],
            ['label' => 'Missed - ไม่เข้าเป้า', 'value' => (int) ($kpiStatusCounts['missed'] ?? 0), 'color' => 'text-red-300', 'bg' => 'bg-red-400/10', 'border' => 'border-red-400/30'],
            ['label' => 'In Progress', 'value' => (int) ($kpiStatusCounts['in_progress'] ?? 0), 'color' => 'text-amber-300', 'bg' => 'bg-amber-400/10', 'border' => 'border-amber-400/30'],
        ];

        $controlStatusCounts = RiskControl::query()
            ->select('status', DB::raw('count(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');
        $totalControls = max(1, (int) $controlStatusCounts->sum());

        $controlSegment = function (string $status, string $label, string $color) use ($controlStatusCounts, $totalControls): array {
            $count = (int) ($controlStatusCounts[$status] ?? 0);
            $percent = round(($count / $totalControls) * 100);

            return [
                'status' => $status,
                'label' => $label,
                'value' => $percent.'%',
                'count' => $count,
                'color' => $color,
                'width' => $percent.'%',
            ];
        };

        $controlSegments = [
            $controlSegment('complete', 'ดำเนินการแล้ว', 'bg-emerald-400'),
            $controlSegment('active', 'เปิดใช้งาน', 'bg-blue-500'),
            $controlSegment('in_progress', 'อยู่ระหว่างทำ', 'bg-cyan-400'),
            $controlSegment('cancel', 'ยกเลิก', 'bg-amber-400'),
        ];

        // Analyze controls by issue type
        $issueStatus = RiskControl::join('qmr_risk_registers', 'qmr_risk_controls.risk_register_id', '=', 'qmr_risk_registers.id')
            ->whereNull('qmr_risk_registers.deleted_at')
            ->select('qmr_risk_registers.issue_type',
                DB::raw('count(*) as total'),
                DB::raw("count(case when qmr_risk_controls.status = 'complete' then 1 end) as complete_count")
            )
            ->groupBy('qmr_risk_registers.issue_type')
            ->get()
            ->map(fn ($item) => [
                'label' => $item->issue_type ?: 'ไม่ระบุประเด็น',
                'total' => $item->total,
                'complete' => $item->complete_count,
                'percent' => $item->total > 0 ? round(($item->complete_count / $item->total) * 100) : 0,
            ]);

        $startDate = now()->subMonths(5);
        $endDate = now();
        $trendRows = RiskRegister::query()
            ->where('created_at', '>=', $startDate->copy()->startOfMonth())
            ->selectRaw('YEAR(created_at) as year_number, MONTH(created_at) as month_number, AVG(risk_score) as before_avg, AVG(improvement_score) as after_avg')
            ->groupBy(DB::raw('YEAR(created_at)'), DB::raw('MONTH(created_at)'))
            ->get()
            ->keyBy(fn ($item) => $item->year_number.'-'.$item->month_number);

        $trendData = [];
        for ($i = 5; $i >= 0; $i--) {
            $monthDate = now()->subMonths($i);
            $monthLabel = $monthDate->translatedFormat('M');
            $averages = $trendRows->get($monthDate->year.'-'.$monthDate->month);

            $trendData[] = [
                'month' => $monthLabel,
                'before' => round($averages->before_avg ?? 0, 1),
                'after' => round($averages->after_avg ?? 0, 1),
            ];
        }

        $trendRange = $startDate->translatedFormat('M Y').' - '.$endDate->translatedFormat('M Y');

        $monthCounts = RiskRegister::query()
            ->where('created_at', '>=', now()->subMonth()->startOfMonth())
            ->selectRaw('YEAR(created_at) as year_number, MONTH(created_at) as month_number, COUNT(*) as total')
            ->groupBy(DB::raw('YEAR(created_at)'), DB::raw('MONTH(created_at)'))
            ->get()
            ->keyBy(fn ($item) => $item->year_number.'-'.$item->month_number);
        $thisMonthCount = (int) ($monthCounts[now()->year.'-'.now()->month]->total ?? 0);
        $lastMonthDate = now()->subMonth();
        $lastMonthCount = (int) ($monthCounts[$lastMonthDate->year.'-'.$lastMonthDate->month]->total ?? 0);
        $riskChange = $thisMonthCount - $lastMonthCount;

        // Calculate control completion change
        $totalControlsCount = $totalControls;
        $currentCompleteCount = (int) ($controlStatusCounts['complete'] ?? 0);
        $lastMonthCompleteCount = RiskControl::where('status', 'complete')
            ->where('updated_at', '<', now()->startOfMonth())
            ->count();

        $currentRate = ($currentCompleteCount / $totalControlsCount) * 100;
        $previousRate = ($lastMonthCompleteCount / $totalControlsCount) * 100;
        $completionChange = round($currentRate - $previousRate, 1);

        // Calculate risks to watch (High level risks)
        $watchCount = RiskRegister::whereIn('improvement_level', ['H', 'VH'])->count();

        $keyRisks = RiskRegister::query()
            ->select(['id', 'code', 'document_title', 'risk_category', 'owner_name', 'risk_score', 'risk_level'])
            ->orderByDesc('risk_score')
            ->limit(4)
            ->get()
            ->map(function ($risk) {
                return [
                    'id' => $risk->code,
                    'db_id' => $risk->id,
                    'title' => $risk->document_title,
                    'category' => $risk->risk_category,
                    'owner' => $risk->owner_name,
                    'score' => $risk->risk_score,
                    'level' => $this->mapLevelName($risk->risk_level),
                ];
            });

        return Inertia::render('QMR/RiskManagement', [
            'risks' => $risks,
            'levelChart' => $levelChart,
            'categoryChart' => $categoryChart,
            'kpiStatus' => $kpiStatus,
            'controlSegments' => $controlSegments,
            'issueStatus' => $issueStatus,
            'trendData' => $trendData,
            'trendRange' => $trendRange,
            'riskChange' => $riskChange,
            'completionChange' => $completionChange,
            'watchCount' => $watchCount,
            'keyRisks' => $keyRisks,
        ]);
    }

    public function risks(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));

        return Inertia::render('QMR/RiskList', [
            'risks' => RiskRegister::query()
                ->when($search !== '', function ($query) use ($search) {
                    $query->where(function ($subQuery) use ($search) {
                        $subQuery
                            ->where('code', 'like', "%{$search}%")
                            ->orWhere('document_title', 'like', "%{$search}%")
                            ->orWhere('owner_name', 'like', "%{$search}%")
                            ->orWhere('risk_category', 'like', "%{$search}%")
                            ->orWhere('process_name', 'like', "%{$search}%");
                    });
                })
                ->latest()
                ->paginate(20)
                ->withQueryString(),
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function kpis(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));

        return Inertia::render('QMR/RiskKpiList', [
            'kpis' => RiskKpi::whereHas('riskRegister')
                ->when($search !== '', function ($query) use ($search) {
                    $query->where(function ($subQuery) use ($search) {
                        $subQuery
                            ->where('code', 'like', "%{$search}%")
                            ->orWhere('name', 'like', "%{$search}%")
                            ->orWhere('threshold', 'like', "%{$search}%")
                            ->orWhereHas('riskRegister', function ($riskQuery) use ($search) {
                                $riskQuery
                                    ->where('code', 'like', "%{$search}%")
                                    ->orWhere('document_title', 'like', "%{$search}%");
                            });
                    });
                })
                ->with(['riskRegister:id,code,document_title'])
                ->latest()
                ->paginate(20)
                ->withQueryString(),
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function createKpi(): Response
    {
        return Inertia::render('QMR/RiskKpi', [
            'risks' => RiskRegister::select('id', 'code', 'document_title')->get(),
        ]);
    }

    public function controls(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));

        return Inertia::render('QMR/RiskControlIndex', [
            'controls' => RiskControl::whereHas('riskRegister')
                ->when($search !== '', function ($query) use ($search) {
                    $query->where(function ($subQuery) use ($search) {
                        $subQuery
                            ->where('code', 'like', "%{$search}%")
                            ->orWhere('name', 'like', "%{$search}%")
                            ->orWhere('responsible_name', 'like', "%{$search}%")
                            ->orWhereHas('riskRegister', function ($riskQuery) use ($search) {
                                $riskQuery
                                    ->where('code', 'like', "%{$search}%")
                                    ->orWhere('document_title', 'like', "%{$search}%");
                            });
                    });
                })
                ->with(['riskRegister:id,code,document_title', 'responsibleUser:id,name'])
                ->latest()
                ->paginate(20)
                ->withQueryString(),
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function createControl(): Response
    {
        return Inertia::render('QMR/RiskControls', [
            'risks' => RiskRegister::select('id', 'code', 'document_title')->get(),
            'kpis' => RiskKpi::select('id', 'code', 'name')->get(),
        ]);
    }

    public function reports(): Response
    {
        // 1. Summary Metrics
        $riskStats = RiskRegister::query()
            ->selectRaw("COUNT(*) as total_risks, COUNT(CASE WHEN risk_level IN ('H', 'VH') THEN 1 END) as high_risks")
            ->first();
        $totalRisks = (int) ($riskStats->total_risks ?? 0);
        $highRisks = (int) ($riskStats->high_risks ?? 0);

        $kpiStats = RiskKpi::query()
            ->whereHas('riskRegister')
            ->selectRaw("COUNT(*) as total_kpis, COUNT(CASE WHEN status = 'met' THEN 1 END) as met_kpis")
            ->first();
        $totalKpis = (int) ($kpiStats->total_kpis ?? 0);
        $metKpis = (int) ($kpiStats->met_kpis ?? 0);
        $kpiSuccessRate = $totalKpis > 0 ? round(($metKpis / $totalKpis) * 100, 1) : 0;

        $controlStats = RiskControl::query()
            ->whereHas('riskRegister')
            ->selectRaw("COUNT(*) as total_controls, COUNT(CASE WHEN status = 'complete' THEN 1 END) as completed_controls")
            ->first();
        $totalControls = (int) ($controlStats->total_controls ?? 0);
        $completedControls = (int) ($controlStats->completed_controls ?? 0);
        $controlCompletionRate = $totalControls > 0 ? round(($completedControls / $totalControls) * 100, 1) : 0;

        // 2. Risk Distribution by Level & Type
        $riskByType = RiskRegister::select('issue_type',
            DB::raw("COUNT(CASE WHEN risk_level IN ('H', 'VH') THEN 1 END) as high"),
            DB::raw("COUNT(CASE WHEN risk_level = 'M' THEN 1 END) as medium"),
            DB::raw("COUNT(CASE WHEN risk_level = 'L' THEN 1 END) as low")
        )
            ->groupBy('issue_type')
            ->get()
            ->map(fn ($item) => [
                'issue_type' => $item->issue_type ?: 'ไม่ระบุประเด็น',
                'high' => (int) $item->high,
                'medium' => (int) $item->medium,
                'low' => (int) $item->low,
            ]);

        // 3. KPI Trend
        $kpiTrendStart = now()->subMonths(5)->startOfMonth();
        $kpiTrendRows = RiskKpi::query()
            ->whereHas('riskRegister')
            ->where('created_at', '>=', $kpiTrendStart)
            ->selectRaw(
                "YEAR(created_at) as year_number,
                MONTH(created_at) as month_number,
                COUNT(CASE WHEN status = 'met' THEN 1 END) as met,
                COUNT(CASE WHEN status = 'missed' THEN 1 END) as missed,
                COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as inProgress"
            )
            ->groupBy(DB::raw('YEAR(created_at)'), DB::raw('MONTH(created_at)'))
            ->get()
            ->keyBy(fn ($item) => $item->year_number.'-'.$item->month_number);

        $kpiTrend = collect(range(5, 0))->map(function (int $monthsAgo) use ($kpiTrendRows) {
            $monthDate = now()->subMonths($monthsAgo);
            $row = $kpiTrendRows->get($monthDate->year.'-'.$monthDate->month);

            return [
                'month' => $monthDate->translatedFormat('M y'),
                'met' => (int) ($row->met ?? 0),
                'missed' => (int) ($row->missed ?? 0),
                'inProgress' => (int) ($row->inProgress ?? 0),
            ];
        })->values();

        // 4. Top Processes (By Risk Count)
        $topMissions = RiskRegister::select(
            DB::raw("CASE WHEN process_name IS NULL OR process_name = '' THEN 'ไม่ได้ระบุพันธกิจ' ELSE process_name END as name"),
            DB::raw('COUNT(*) as value')
        )
            ->groupBy('process_name')
            ->orderByDesc('value')
            ->limit(10)
            ->get()
            ->map(fn ($item) => [
                'name' => $item->name,
                'value' => (int) $item->value,
            ]);

        return Inertia::render('QMR/RiskReports', [
            'stats' => [
                'totalRisks' => $totalRisks,
                'highRisks' => $highRisks,
                'kpiSuccessRate' => $kpiSuccessRate,
                'controlCompletionRate' => $controlCompletionRate,
                'totalControls' => $totalControls,
                'metKpis' => $metKpis,
                'totalKpis' => $totalKpis,
            ],
            'riskByType' => $riskByType,
            'kpiTrend' => $kpiTrend,
            'topMissions' => $topMissions,
        ]);
    }

    public function create(): Response
    {
        $latestEffectiveDate = RiskRegister::query()
            ->whereNotNull('effective_date')
            ->max('effective_date');

        return Inertia::render('QMR/RiskRegistry', [
            'latestEffectiveDate' => $this->normalizeDate($latestEffectiveDate),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|unique:qmr_risk_registers,code',
            'document_type' => 'nullable|string',
            'document_code' => 'nullable|string',
            'document_name' => 'nullable|string',
            'effective_date' => 'nullable|date',
            'revision_no' => 'nullable|string',
            'document_title' => 'nullable|string',
            'issue_type' => 'nullable|string',
            'consideration' => 'required|string',
            'stakeholder' => 'nullable|string',
            'expectation' => 'required|string',
            'impact' => 'nullable|string',
            'risk_category' => 'nullable|string',
            'process_name' => 'nullable|string',
            'owner_name' => 'nullable|string',
            'risk_likelihood' => 'required|integer|min:1|max:5',
            'risk_impact' => 'required|integer|min:1|max:5',
            'improvement_likelihood' => 'required|integer|min:1|max:5',
            'improvement_impact' => 'required|integer|min:1|max:5',
            'status' => ['nullable', Rule::in(['active', 'inactive'])],
        ]);

        RiskRegister::create(array_merge($validated, [
            'created_by' => auth()->id(),
        ]));

        return redirect()->route('qmr.risk-management.risks')->with('success', 'บันทึกข้อมูลเรียบร้อยแล้ว');
    }

    public function edit(RiskRegister $risk): Response
    {
        return Inertia::render('QMR/RiskRegistry', [
            'risk' => [
                ...$risk->toArray(),
                'effective_date' => $this->normalizeDate($risk->effective_date),
            ],
        ]);
    }

    public function update(Request $request, RiskRegister $risk)
    {
        $validated = $request->validate([
            'code' => 'required|string|unique:qmr_risk_registers,code,'.$risk->id,
            'document_type' => 'nullable|string',
            'document_code' => 'nullable|string',
            'document_name' => 'nullable|string',
            'effective_date' => 'nullable|date',
            'revision_no' => 'nullable|string',
            'document_title' => 'nullable|string',
            'issue_type' => 'nullable|string',
            'consideration' => 'required|string',
            'stakeholder' => 'nullable|string',
            'expectation' => 'required|string',
            'impact' => 'nullable|string',
            'risk_category' => 'nullable|string',
            'process_name' => 'nullable|string',
            'owner_name' => 'nullable|string',
            'risk_likelihood' => 'required|integer|min:1|max:5',
            'risk_impact' => 'required|integer|min:1|max:5',
            'improvement_likelihood' => 'required|integer|min:1|max:5',
            'improvement_impact' => 'required|integer|min:1|max:5',
            'status' => ['nullable', Rule::in(['active', 'inactive'])],
        ]);

        $risk->update(array_merge($validated, [
            'updated_by' => auth()->id(),
        ]));

        return redirect()->route('qmr.risk-management.risks')->with('success', 'อัปเดตข้อมูลเรียบร้อยแล้ว');
    }

    public function destroy(RiskRegister $risk)
    {
        $risk->delete();

        return redirect()->route('qmr.risk-management.risks')->with('success', 'ลบข้อมูลเรียบร้อยแล้ว');
    }

    // KPI CRUD
    public function storeKpi(Request $request)
    {
        $validated = $request->validate([
            'risk_register_id' => [
                'required',
                Rule::exists('qmr_risk_registers', 'id')->whereNull('deleted_at'),
            ],
            'code' => 'required|string|unique:qmr_risk_kpis,code',
            'name' => 'required|string',
            'threshold' => 'nullable|string',
            'unit' => 'nullable|string',
            'direction' => ['nullable', Rule::in(['higher_better', 'lower_better', 'target'])],
            'target_value' => 'nullable|numeric',
            'status' => ['required', Rule::in(['met', 'missed', 'in_progress'])],
        ]);

        RiskKpi::create($validated);

        return redirect()->route('qmr.risk-management.kpi')->with('success', 'บันทึก KPI เรียบร้อยแล้ว');
    }

    public function editKpi(RiskKpi $kpi)
    {
        return Inertia::render('QMR/RiskKpi', [
            'kpi' => $kpi,
            'risks' => RiskRegister::select('id', 'code', 'document_title')->get(),
        ]);
    }

    public function updateKpi(Request $request, RiskKpi $kpi)
    {
        $validated = $request->validate([
            'risk_register_id' => [
                'required',
                Rule::exists('qmr_risk_registers', 'id')->whereNull('deleted_at'),
            ],
            'code' => 'required|string|unique:qmr_risk_kpis,code,'.$kpi->id,
            'name' => 'required|string',
            'threshold' => 'nullable|string',
            'unit' => 'nullable|string',
            'direction' => ['nullable', Rule::in(['higher_better', 'lower_better', 'target'])],
            'target_value' => 'nullable|numeric',
            'status' => ['required', Rule::in(['met', 'missed', 'in_progress'])],
        ]);

        $kpi->update($validated);

        return redirect()->route('qmr.risk-management.kpi')->with('success', 'อัปเดต KPI เรียบร้อยแล้ว');
    }

    public function destroyKpi(RiskKpi $kpi)
    {
        $kpi->delete();

        return redirect()->route('qmr.risk-management.kpi')->with('success', 'ลบ KPI เรียบร้อยแล้ว');
    }

    // Control CRUD
    public function storeControl(Request $request)
    {
        $validated = $request->validate([
            'risk_register_id' => [
                'required',
                Rule::exists('qmr_risk_registers', 'id')->whereNull('deleted_at'),
            ],
            'risk_kpi_id' => [
                'nullable',
                Rule::exists('qmr_risk_kpis', 'id')
                    ->where('risk_register_id', $request->input('risk_register_id'))
                    ->whereNull('deleted_at'),
            ],
            'code' => 'nullable|string|unique:qmr_risk_controls,code',
            'name' => 'required|string',
            'description' => 'nullable|string',
            'status' => ['required', Rule::in(['active', 'complete', 'in_progress', 'cancel'])],
            'progress_percent' => 'required|integer|min:0|max:100',
            'responsible_name' => 'nullable|string',
            'start_date' => 'nullable|date',
            'due_date' => 'nullable|date',
            'note' => 'nullable|string',
        ]);

        RiskControl::create(array_merge($validated, [
            'created_by' => auth()->id(),
        ]));

        return redirect()->route('qmr.risk-management.controls')->with('success', 'บันทึกมาตรการเรียบร้อยแล้ว');
    }

    public function editControl(RiskControl $control)
    {
        return Inertia::render('QMR/RiskControls', [
            'control' => [
                ...$control->toArray(),
                'start_date' => $this->normalizeDate($control->start_date),
                'due_date' => $this->normalizeDate($control->due_date),
            ],
            'risks' => RiskRegister::select('id', 'code', 'document_title')->get(),
            'kpis' => RiskKpi::select('id', 'code', 'name')->get(),
        ]);
    }

    public function updateControl(Request $request, RiskControl $control)
    {
        $validated = $request->validate([
            'risk_register_id' => [
                'required',
                Rule::exists('qmr_risk_registers', 'id')->whereNull('deleted_at'),
            ],
            'risk_kpi_id' => [
                'nullable',
                Rule::exists('qmr_risk_kpis', 'id')
                    ->where('risk_register_id', $request->input('risk_register_id'))
                    ->whereNull('deleted_at'),
            ],
            'code' => 'nullable|string|unique:qmr_risk_controls,code,'.$control->id,
            'name' => 'required|string',
            'description' => 'nullable|string',
            'status' => ['required', Rule::in(['active', 'complete', 'in_progress', 'cancel'])],
            'progress_percent' => 'required|integer|min:0|max:100',
            'responsible_name' => 'nullable|string',
            'start_date' => 'nullable|date',
            'due_date' => 'nullable|date',
            'note' => 'nullable|string',
        ]);

        $control->update(array_merge($validated, [
            'updated_by' => auth()->id(),
        ]));

        return redirect()->route('qmr.risk-management.controls')->with('success', 'อัปเดตมาตรการเรียบร้อยแล้ว');
    }

    public function destroyControl(RiskControl $control)
    {
        $control->delete();

        return redirect()->route('qmr.risk-management.controls')->with('success', 'ลบมาตรการเรียบร้อยแล้ว');
    }

    private function mapLevelName(string $level): string
    {
        return match ($level) {
            'VH', 'H' => 'สูงมาก',
            'M' => 'ปานกลาง',
            'L' => 'ต่ำ',
            default => 'ต่ำ',
        };
    }

    private function getCategoryColor(?string $category): string
    {
        return match ($category) {
            'Operation' => '#2563eb',
            'Strategic' => '#7c3aed',
            'Finance' => '#06b6d4',
            'Compliance' => '#10b981',
            default => '#64748b',
        };
    }

    private function normalizeDate(mixed $value): ?string
    {
        if (! $value) {
            return null;
        }

        $date = trim((string) $value);
        $date = preg_replace('/:(AM|PM)$/i', ' $1', $date) ?? $date;

        try {
            return Carbon::parse($date)->toDateString();
        } catch (\Throwable) {
            return substr($date, 0, 10) ?: null;
        }
    }
}
