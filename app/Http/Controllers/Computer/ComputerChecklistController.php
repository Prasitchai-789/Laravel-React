<?php

namespace App\Http\Controllers\Computer;

use Inertia\Inertia;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\Computer\ComputerChecklistTopic;

class ComputerChecklistController extends Controller
{
    public function index()
    {
        return Inertia::render('Computer/ChecklistManagement');
    }

    public function apiIndex()
    {
        $topics = ComputerChecklistTopic::orderBy('order', 'asc')->get();
        return response()->json(['success' => true, 'topics' => $topics]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'is_active' => 'boolean',
            'order' => 'integer',
        ]);

        if (!isset($validated['order'])) {
            $validated['order'] = ComputerChecklistTopic::max('order') + 10;
        }

        $topic = ComputerChecklistTopic::create($validated);
        return response()->json(['success' => true, 'topic' => $topic]);
    }

    public function update(Request $request, $id)
    {
        $topic = ComputerChecklistTopic::findOrFail($id);
        
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'is_active' => 'boolean',
            'order' => 'integer',
        ]);

        $topic->update($validated);
        return response()->json(['success' => true, 'topic' => $topic]);
    }

    public function destroy($id)
    {
        $topic = ComputerChecklistTopic::findOrFail($id);
        $topic->delete();
        return response()->json(['success' => true]);
    }

    public function reorder(Request $request)
    {
        $request->validate([
            'topics' => 'required|array',
            'topics.*.id' => 'required|integer|exists:computer_checklist_topics,id',
            'topics.*.order' => 'required|integer',
        ]);

        foreach ($request->topics as $t) {
            ComputerChecklistTopic::where('id', $t['id'])->update(['order' => $t['order']]);
        }

        return response()->json(['success' => true]);
    }
}
