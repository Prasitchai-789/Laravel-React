import React from "react";
import { CPORecord } from "../../types";
import RecordRow from "./RecordRow";
import TableHeader from "./TableHeader";

interface Props {
    records: CPORecord[];
    calculateTankTotals: any;
    calculateQualityAverages: any;
    onEdit: (record: CPORecord) => void;
    onDelete: (id: number) => void;
    sortField: string;
    sortDirection: string;
    onSort: (f: string) => void;
    getSortIcon: (f: string) => JSX.Element | null;
    densityRef: any[];
}

export default function RecordsTable({
    records,
    calculateTankTotals,
    calculateQualityAverages,
    onEdit,
    onDelete,
    sortField,
    sortDirection,
    onSort,
    getSortIcon,
    densityRef,
}: Props) {
    return (
        <div className="overflow-hidden rounded-3xl border border-white/50 bg-white/70 shadow-2xl backdrop-blur-sm">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <TableHeader onSort={onSort} getSortIcon={getSortIcon} />

                    <tbody className="divide-y divide-gray-100/50">
                        {records.map((record, i) => (
                            <RecordRow
                                key={record.id}
                                record={record}
                                index={i}
                                calculateTankTotals={calculateTankTotals}
                                calculateQualityAverages={calculateQualityAverages}
                                onEdit={onEdit}
                                onDelete={onDelete}
                                densityRef={densityRef}
                            />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
