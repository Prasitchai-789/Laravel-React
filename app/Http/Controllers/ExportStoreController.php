<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\StoreExport;
class ExportStoreController extends Controller
{
    //

    public function export()
    {
        return Excel::download(new StoreExport, 'StoreExport.xlsx');
    }
}
