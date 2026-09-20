package com.relativity.lengthcontraction;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.DashPathEffect;
import android.graphics.Paint;
import android.util.AttributeSet;
import android.view.MotionEvent;
import android.view.View;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * 3D Canvas rendering for the moving contracted cube,
 * the ghost rigid reference cube, and the atom grip points lattice.
 */
public class RelativisticSurfaceView extends View {

    private Paint cubePaint;
    private Paint cubeEdgePaint;
    private Paint ghostPaint;
    private Paint atomPaint;
    private Paint bondPaint;
    private Paint axisPaint;

    // Projection / Camera angles (interactive touch orbit)
    private float rotX = 25f;
    private float rotY = -35f;
    private float lastTouchX, lastTouchY;

    // Parsed 3D geometry from Python
    private double[][] cubeVertices = new double[8][3];
    private double[][] ghostVertices = new double[8][3];
    private double[][] atomPoints = new double[0][3];
    private int[][] bonds = new int[0][2];
    private double gamma = 1.0;
    private String axis = "x";

    public RelativisticSurfaceView(Context context, AttributeSet attrs) {
        super(context, attrs);
        init();
    }

    private void init() {
        cubePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        cubePaint.setColor(Color.argb(80, 14, 165, 233)); // Translucent Cyan
        cubePaint.setStyle(Paint.Style.FILL);

        cubeEdgePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        cubeEdgePaint.setColor(Color.parseColor("#38BDF8"));
        cubeEdgePaint.setStyle(Paint.Style.STROKE);
        cubeEdgePaint.setStrokeWidth(4f);

        ghostPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        ghostPaint.setColor(Color.argb(180, 148, 163, 184)); // Faint slate dashed
        ghostPaint.setStyle(Paint.Style.STROKE);
        ghostPaint.setStrokeWidth(2f);
        ghostPaint.setPathEffect(new DashPathEffect(new float[]{12f, 8f}, 0));

        atomPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        atomPaint.setColor(Color.parseColor("#22D3EE"));
        atomPaint.setStyle(Paint.Style.FILL);

        bondPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        bondPaint.setColor(Color.argb(90, 6, 182, 212));
        bondPaint.setStrokeWidth(1.5f);

        axisPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        axisPaint.setColor(Color.parseColor("#E0E7FF"));
        axisPaint.setStrokeWidth(2f);
    }

    public void updateStateFromJson(String jsonString) {
        try {
            JSONObject root = new JSONObject(jsonString);
            JSONObject metrics = root.getJSONObject("metrics");
            this.gamma = metrics.getDouble("gamma");
            this.axis = metrics.getString("motion_axis");

            // Parse cube vertices
            JSONArray cVerts = root.getJSONArray("cube_vertices");
            for (int i = 0; i < 8; i++) {
                JSONArray v = cVerts.getJSONArray(i);
                cubeVertices[i] = new double[]{v.getDouble(0), v.getDouble(1), v.getDouble(2)};
            }

            // Parse ghost vertices
            JSONArray gVerts = root.getJSONArray("ghost_vertices");
            for (int i = 0; i < 8; i++) {
                JSONArray v = gVerts.getJSONArray(i);
                ghostVertices[i] = new double[]{v.getDouble(0), v.getDouble(1), v.getDouble(2)};
            }

            // Parse atoms
            JSONArray atoms = root.getJSONArray("atoms");
            atomPoints = new double[atoms.length()][3];
            for (int i = 0; i < atoms.length(); i++) {
                JSONArray a = atoms.getJSONArray(i);
                atomPoints[i] = new double[]{a.getDouble(0), a.getDouble(1), a.getDouble(2)};
            }

            // Parse bonds
            JSONArray bArr = root.getJSONArray("bonds");
            bonds = new int[bArr.length()][2];
            for (int i = 0; i < bArr.length(); i++) {
                JSONArray b = bArr.getJSONArray(i);
                bonds[i] = new int[]{b.getInt(0), b.getInt(1)};
            }

            // Dynamic color shift if gamma > 50
            if (gamma > 50) {
                cubeEdgePaint.setColor(Color.parseColor("#D8B4FE"));
                atomPaint.setColor(Color.parseColor("#F0ABFC"));
            } else {
                cubeEdgePaint.setColor(Color.parseColor("#38BDF8"));
                atomPaint.setColor(Color.parseColor("#22D3EE"));
            }

            invalidate();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Override
    public boolean onTouchEvent(MotionEvent event) {
        switch (event.getAction()) {
            case MotionEvent.ACTION_DOWN:
                lastTouchX = event.getX();
                lastTouchY = event.getY();
                return true;
            case MotionEvent.ACTION_MOVE:
                float dx = event.getX() - lastTouchX;
                float dy = event.getY() - lastTouchY;
                rotY += dx * 0.5f;
                rotX -= dy * 0.5f;
                lastTouchX = event.getX();
                lastTouchY = event.getY();
                invalidate();
                return true;
        }
        return super.onTouchEvent(event);
    }

    private float[] project3D(double x, double y, double z, float cx, float cy, float scale) {
        // Rotate around Y
        double radY = Math.toRadians(rotY);
        double cosY = Math.cos(radY);
        double sinY = Math.sin(radY);
        double x1 = x * cosY + z * sinY;
        double z1 = -x * sinY + z * cosY;

        // Rotate around X
        double radX = Math.toRadians(rotX);
        double cosX = Math.cos(radX);
        double sinX = Math.sin(radX);
        double y2 = y * cosX - z1 * sinX;
        double z2 = y * sinX + z1 * cosX;

        // Perspective division
        float cameraDist = 6.0f;
        float pScale = (float) (scale * cameraDist / (cameraDist + z2));

        float screenX = cx + (float) (x1 * pScale);
        float screenY = cy - (float) (y2 * pScale);
        return new float[]{screenX, screenY, (float) z2};
    }

    @Override
    protected void onDraw(Canvas canvas) {
        super.onDraw(canvas);

        float cx = getWidth() / 2f;
        float cy = getHeight() / 2f;
        float baseScale = Math.min(cx, cy) * 0.65f;

        // 1. Draw Ghost Rigid Cube (Rest Frame Reference L0)
        int[][] edges = {
            {0,1}, {1,2}, {2,3}, {3,0},
            {4,5}, {5,6}, {6,7}, {7,4},
            {0,4}, {1,5}, {2,6}, {3,7}
        };

        if (ghostVertices != null && ghostVertices[0] != null) {
            float[][] projectedGhost = new float[8][2];
            for (int i = 0; i < 8; i++) {
                float[] p = project3D(ghostVertices[i][0], ghostVertices[i][1], ghostVertices[i][2], cx, cy, baseScale);
                projectedGhost[i][0] = p[0];
                projectedGhost[i][1] = p[1];
            }
            for (int[] edge : edges) {
                canvas.drawLine(
                    projectedGhost[edge[0]][0], projectedGhost[edge[0]][1],
                    projectedGhost[edge[1]][0], projectedGhost[edge[1]][1],
                    ghostPaint
                );
            }
        }

        // 2. Draw Atom Lattice Grip Bonds (shorten along motion axis)
        if (atomPoints != null && atomPoints.length > 0 && bonds != null) {
            float[][] projectedAtoms = new float[atomPoints.length][2];
            for (int i = 0; i < atomPoints.length; i++) {
                float[] p = project3D(atomPoints[i][0], atomPoints[i][1], atomPoints[i][2], cx, cy, baseScale);
                projectedAtoms[i][0] = p[0];
                projectedAtoms[i][1] = p[1];
            }

            for (int[] b : bonds) {
                if (b[0] < projectedAtoms.length && b[1] < projectedAtoms.length) {
                    canvas.drawLine(
                        projectedAtoms[b[0]][0], projectedAtoms[b[0]][1],
                        projectedAtoms[b[1]][0], projectedAtoms[b[1]][1],
                        bondPaint
                    );
                }
            }

            // 3. Draw Atom Grip Points
            float atomRadius = Math.max(3f, baseScale * 0.035f);
            for (int i = 0; i < projectedAtoms.length; i++) {
                canvas.drawCircle(projectedAtoms[i][0], projectedAtoms[i][1], atomRadius, atomPaint);
            }
        }

        // 4. Draw Contracted Moving Cube Edges
        if (cubeVertices != null && cubeVertices[0] != null) {
            float[][] projectedCube = new float[8][2];
            for (int i = 0; i < 8; i++) {
                float[] p = project3D(cubeVertices[i][0], cubeVertices[i][1], cubeVertices[i][2], cx, cy, baseScale);
                projectedCube[i][0] = p[0];
                projectedCube[i][1] = p[1];
            }
            for (int[] edge : edges) {
                canvas.drawLine(
                    projectedCube[edge[0]][0], projectedCube[edge[0]][1],
                    projectedCube[edge[1]][0], projectedCube[edge[1]][1],
                    cubeEdgePaint
                );
            }
        }
    }
}
