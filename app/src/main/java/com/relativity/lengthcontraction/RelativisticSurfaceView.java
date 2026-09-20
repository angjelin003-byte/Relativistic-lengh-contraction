package com.relativity.lengthcontraction;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.DashPathEffect;
import android.graphics.Paint;
import android.graphics.Path;
import android.util.AttributeSet;
import android.view.MotionEvent;
import android.view.View;
import com.chaquo.python.PyObject;
import com.chaquo.python.Python;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * 3D Canvas view entirely powered by the Chaquopy Python Relativistic Engine.
 *
 * Touch orbits, 3D perspective projection, depth-sorting, Doppler color shifts,
 * atom grip points, compacted lattice bonds, and ghost cube reference frames
 * are calculated directly in Python.
 */
public class RelativisticSurfaceView extends View {

    private Paint fillPaint;
    private Paint solidLinePaint;
    private Paint dashedLinePaint;
    private Paint circlePaint;
    private Path polyPath;

    private PyObject pyModule;

    public RelativisticSurfaceView(Context context, AttributeSet attrs) {
        super(context, attrs);
        init();
    }

    private void init() {
        fillPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        fillPaint.setStyle(Paint.Style.FILL);

        solidLinePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        solidLinePaint.setStyle(Paint.Style.STROKE);
        solidLinePaint.setStrokeCap(Paint.Cap.ROUND);

        dashedLinePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        dashedLinePaint.setStyle(Paint.Style.STROKE);
        dashedLinePaint.setStrokeWidth(2f);
        dashedLinePaint.setColor(Color.parseColor("#94A3B8"));
        dashedLinePaint.setPathEffect(new DashPathEffect(new float[]{12f, 8f}, 0));

        circlePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        circlePaint.setStyle(Paint.Style.FILL);

        polyPath = new Path();

        try {
            if (Python.isStarted()) {
                pyModule = Python.getInstance().getModule("main");
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public void setPyModule(PyObject module) {
        this.pyModule = module;
        invalidate();
    }

    @Override
    public boolean onTouchEvent(MotionEvent event) {
        float x = event.getX();
        float y = event.getY();

        if (pyModule != null) {
            try {
                switch (event.getAction()) {
                    case MotionEvent.ACTION_DOWN:
                        pyModule.callAttr("android_on_touch_down", x, y);
                        return true;
                    case MotionEvent.ACTION_MOVE:
                        pyModule.callAttr("android_on_touch_move", x, y);
                        invalidate();
                        return true;
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
        return super.onTouchEvent(event);
    }

    @Override
    protected void onDraw(Canvas canvas) {
        super.onDraw(canvas);

        int width = getWidth();
        int height = getHeight();
        if (width <= 0 || height <= 0) return;

        if (pyModule != null) {
            try {
                // Call Python to compute entire 3D perspective projection and render packet
                PyObject pyPacket = pyModule.callAttr("android_render_scene", width, height);
                String jsonPacket = pyPacket.toString();
                JSONObject scene = new JSONObject(jsonPacket);

                // 1. Draw polygons (shaded transparent cube faces)
                if (scene.has("polygons")) {
                    JSONArray polygons = scene.getJSONArray("polygons");
                    for (int i = 0; i < polygons.length(); i++) {
                        JSONArray poly = polygons.getJSONArray(i);
                        JSONArray pts = poly.getJSONArray(0);
                        String colorStr = poly.getString(1);

                        polyPath.reset();
                        for (int j = 0; j < pts.length(); j++) {
                            JSONArray pt = pts.getJSONArray(j);
                            float px = (float) pt.getDouble(0);
                            float py = (float) pt.getDouble(1);
                            if (j == 0) {
                                polyPath.moveTo(px, py);
                            } else {
                                polyPath.lineTo(px, py);
                            }
                        }
                        polyPath.close();
                        fillPaint.setColor(parseColorSafe(colorStr, 0x330284C7));
                        canvas.drawPath(polyPath, fillPaint);
                    }
                }

                // 2. Draw lines (dashed ghost cube, lattice bonds, contracted cube wireframe)
                if (scene.has("lines")) {
                    JSONArray lines = scene.getJSONArray("lines");
                    for (int i = 0; i < lines.length(); i++) {
                        JSONArray line = lines.getJSONArray(i);
                        float x1 = (float) line.getDouble(0);
                        float y1 = (float) line.getDouble(1);
                        float x2 = (float) line.getDouble(2);
                        float y2 = (float) line.getDouble(3);
                        String colorStr = line.getString(4);
                        float strokeWidth = (float) line.getDouble(5);
                        int isDashed = line.getInt(6);

                        if (isDashed == 1) {
                            dashedLinePaint.setColor(parseColorSafe(colorStr, 0x8094A3B8));
                            canvas.drawLine(x1, y1, x2, y2, dashedLinePaint);
                        } else {
                            solidLinePaint.setColor(parseColorSafe(colorStr, 0xFF38BDF8));
                            solidLinePaint.setStrokeWidth(strokeWidth);
                            canvas.drawLine(x1, y1, x2, y2, solidLinePaint);
                        }
                    }
                }

                // 3. Draw circles (atom grip points)
                if (scene.has("circles")) {
                    JSONArray circles = scene.getJSONArray("circles");
                    for (int i = 0; i < circles.length(); i++) {
                        JSONArray circle = circles.getJSONArray(i);
                        float cx = (float) circle.getDouble(0);
                        float cy = (float) circle.getDouble(1);
                        float radius = (float) circle.getDouble(2);
                        String colorStr = circle.getString(3);

                        circlePaint.setColor(parseColorSafe(colorStr, 0xFF22D3EE));
                        canvas.drawCircle(cx, cy, radius, circlePaint);
                    }
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }

    private int parseColorSafe(String colorStr, int fallback) {
        try {
            if (colorStr.startsWith("#")) {
                if (colorStr.length() == 9) {
                    // #RRGGBBAA to #AARRGGBB
                    String r = colorStr.substring(1, 3);
                    String g = colorStr.substring(3, 5);
                    String b = colorStr.substring(5, 7);
                    String a = colorStr.substring(7, 9);
                    return Color.parseColor("#" + a + r + g + b);
                }
                return Color.parseColor(colorStr);
            }
        } catch (Exception ignored) {}
        return fallback;
    }
}
