<?php

namespace App\Http\Controllers\Dashboard;

use App\Models\Activity;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class ActivityController extends Controller
{
    /**
     * Display a listing of activities with images
     */
    public function index()
    {
        $activities = Activity::where('status', 'active')
            ->with('images')
            ->orderBy('activity_date', 'desc')
            ->paginate(12);

        return $activities;
    }

    /**
     * Get all activities for dashboard gallery
     */
    public function gallery()
    {
        $activities = Activity::where('status', 'active')
            ->with(['images' => function ($query) {
                $query->orderBy('display_order', 'asc');
            }])
            ->orderBy('activity_date', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $activities,
            'total' => $activities->count(),
        ]);
    }

    /**
     * Store a newly created activity
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'activity_date' => 'required|date',
            'location' => 'nullable|string|max:255',
            'status' => 'in:active,inactive,archived',
        ]);

        $validated['created_by'] = auth()->id();

        $activity = Activity::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Activity created successfully',
            'data' => $activity,
        ]);
    }

    /**
     * Upload image for activity
     */
    public function uploadImage(Request $request, Activity $activity)
    {
        $validated = $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg,gif|max:5120',
            'alt_text' => 'nullable|string|max:255',
            'display_order' => 'nullable|integer|min:0',
        ]);

        if ($request->hasFile('image')) {
            $file = $request->file('image');
            $filename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('activities', $filename, 'public');

            $activity->images()->create([
                'image_path' => '/storage/' . $path,
                'image_alt_text' => $validated['alt_text'] ?? $activity->title,
                'display_order' => $validated['display_order'] ?? 0,
                'uploaded_by' => auth()->id(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Image uploaded successfully',
                'image_path' => '/storage/' . $path,
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'No image provided',
        ], 400);
    }

    /**
     * Update activity
     */
    public function update(Request $request, Activity $activity)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'activity_date' => 'required|date',
            'location' => 'nullable|string|max:255',
            'status' => 'in:active,inactive,archived',
        ]);

        $activity->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Activity updated successfully',
            'data' => $activity,
        ]);
    }

    /**
     * Delete image
     */
    public function deleteImage($id)
    {
        $image = \App\Models\ActivityImage::find($id);

        if (!$image) {
            return response()->json([
                'success' => false,
                'message' => 'Image not found',
            ], 404);
        }

        // Delete file if it exists
        if (file_exists(public_path($image->image_path))) {
            @unlink(public_path($image->image_path));
        }

        $image->delete();

        return response()->json([
            'success' => true,
            'message' => 'Image deleted successfully',
        ]);
    }

    /**
     * Delete activity
     */
    public function destroy(Activity $activity)
    {
        // Delete all images
        foreach ($activity->images as $image) {
            if (file_exists(public_path($image->image_path))) {
                @unlink(public_path($image->image_path));
            }
        }

        $activity->delete();

        return response()->json([
            'success' => true,
            'message' => 'Activity deleted successfully',
        ]);
    }
}
