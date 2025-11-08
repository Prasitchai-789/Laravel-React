<?php

namespace App\Http\Controllers\ERP;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Inertia\Inertia;
class ERPController extends Controller
{

 public function index(){



      return Inertia::render('ERP/ERPIndex');
 }
 public function Dashboard(){



      return Inertia::render('ERP/ERPDashboard');
 }
 public function Detail(){



      return Inertia::render('ERP/ERPDetail');
 }
 public function ImportExcel(){



      return Inertia::render('ERP/ImportExcel');
 }
 public function shifts(){



      return Inertia::render('ERP/compornent/Shifts');

 }
 public function overtime(){



      return Inertia::render('ERP/OT/OT');

 }









}
