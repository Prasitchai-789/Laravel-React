// resources/js/pages/ERP/Shifts/components/CommonHolidaysCard.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface CommonHolidaysCardProps {
  commonHolidays: any[];
}

const CommonHolidaysCard: React.FC<CommonHolidaysCardProps> = ({ commonHolidays }) => {
  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-800">
          วันหยุดทั่วไป
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {commonHolidays.slice(0, 3).map((holiday, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
              <div className="text-sm">
                <div className="font-medium text-blue-800">{holiday.name}</div>
                <div className="text-blue-600">
                  {new Date(holiday.date).toLocaleDateString('th-TH')}
                </div>
              </div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                ทุกกะ
              </Badge>
            </div>
          ))}
          {commonHolidays.length > 3 && (
            <div className="text-center pt-2">
              <Button variant="link" className="text-blue-600 text-sm">
                ดูทั้งหมด {commonHolidays.length} วัน
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CommonHolidaysCard;
