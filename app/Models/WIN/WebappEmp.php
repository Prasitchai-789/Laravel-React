<?php

namespace App\Models\WIN;

use Carbon\Carbon;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class WebappEmp extends Model
{
    //
    protected $connection = 'sqlsrv2';

    use HasFactory;
    protected $table = 'Webapp_Emp';
    protected $primaryKey = 'EmpID';

    public $timestamps = false;
    // ฟิลด์ที่อนุญาตให้ mass assignment
    protected $fillable = [];

    public function user()
    {
        return $this->hasOne(User::class, 'employee_id', 'EmpID');
    }

    public function education()
    {
        return $this->belongsTo(Education::class, 'EduID', 'EduID');
    }
    public function religion()
    {
        return $this->belongsTo(Religion::class, 'ReligionID', 'ReligionID');
    }
    public function empTitle()
    {
        return $this->belongsTo(EmpTitle::class, 'EmpTitle', 'EmpTitleID');
    }
    public function webDept()
    {
        return $this->belongsTo(WebappDept::class, 'DeptID', 'DeptID');
    }

    public function webCity()
    {
        return $this->belongsTo(WebCity::class, 'ProvinceID', 'ProvinceID');
    }

    public function province()
    {
        return $this->belongsTo(WebCity::class, 'ProvinceID', 'ProvinceID');
    }
    public function district()
    {
        return $this->belongsTo(WebCity::class, 'DistID', 'DistrictID');
    }

    public function subDistrict()
    {
        return $this->belongsTo(WebCity::class, 'SubDistID', 'SubDistrictID');
    }

    public function getWorkDurationAttribute()
    {
        if (!$this->BeginWorkDate) {
            return 'ไม่พบวันที่เริ่มงาน';
        }

        $startDate = Carbon::parse($this->BeginWorkDate);
        $now = Carbon::now();

        $diff = $startDate->diff($now);

        $years = $diff->y;
        $months = $diff->m;

        $duration = '';
        if ($years > 0) {
            $duration .= $years . ' ปี';
        }
        if ($months > 0) {
            $duration .= ($duration ? ' ' : '') . $months . ' เดือน';
        }

        return $duration ?: 'น้อยกว่า 1 เดือน';
    }

    public function getYearOldAttribute()
    {
        if (!$this->BirthDay) {
            return 'ไม่พบวันที่เริ่มงาน';
        }

        $startDate = Carbon::parse($this->BirthDay);
        $now = Carbon::now();

        $diff = $startDate->diff($now);

        $years = $diff->y;
        $months = $diff->m;

        $birthDay = '';
        if ($years > 0) {
            $birthDay .= $years . ' ปี';
        }
        if ($months > 0) {
            $birthDay .= ($birthDay ? ' ' : '') . $months . ' เดือน';
        }

        return $birthDay ?: 'น้อยกว่า 1 เดือน';
    }

    public function getFormattedIdCardAttribute()
    {
        if (!$this->IDCardNumber || strlen($this->IDCardNumber) != 13) {
            return 'รูปแบบไม่ถูกต้อง';
        }

        return substr($this->IDCardNumber, 0, 1) . '-' .
            substr($this->IDCardNumber, 1, 4) . '-' .
            substr($this->IDCardNumber, 5, 5) . '-' .
            substr($this->IDCardNumber, 10, 2) . '-' .
            substr($this->IDCardNumber, 12, 1);
    }

    public function getFormattedTelAttribute()
    {
        if (!$this->Tel) {
            return '-'; // กรณีไม่มีเบอร์
        }

        $tel = preg_replace('/\D/', '', $this->Tel); // ลบอักขระที่ไม่ใช่ตัวเลข

        if (strlen($tel) == 10) {
            // เบอร์มือถือ 10 หลัก เช่น 0812345678 → 081-234-5678
            return substr($tel, 0, 3) . '-' . substr($tel, 3, 3) . '-' . substr($tel, 6);
        } elseif (strlen($tel) == 9) {
            // เบอร์บ้าน 9 หลัก เช่น 021234567 → 02-123-4567
            return substr($tel, 0, 2) . '-' . substr($tel, 2, 3) . '-' . substr($tel, 5);
        }

        return $this->Tel; // กรณีเป็นเบอร์รูปแบบอื่น
    }

    public function leaveRequests()
    {
        // return $this->hasMany(LeaveRequest::class, 'EmpID');
    }

    public function trainings()
    {
        // return $this->belongsToMany(Training::class, 'employee_trainings')->withPivot(['status', 'result', 'trainer', 'date', 'evidence_file'])->withTimestamps();
    }

}
