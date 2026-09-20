package com.relativity.lengthcontraction;

import android.os.Bundle;
import android.widget.Button;
import android.widget.SeekBar;
import android.widget.TextView;
import androidx.appcompat.app.AppCompatActivity;
import com.chaquo.python.PyObject;
import com.chaquo.python.Python;
import com.chaquo.python.android.AndroidPlatform;
import org.json.JSONObject;

public class MainActivity extends AppCompatActivity {

    private RelativisticSurfaceView surfaceView;
    private TextView textSpeed;
    private TextView textGamma;
    private TextView textLength;
    private TextView textDensity;
    private SeekBar speedSeekBar;

    private PyObject pyModule;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        surfaceView = findViewById(R.id.relativistic_3d_view);
        textSpeed = findViewById(R.id.text_speed_label);
        textGamma = findViewById(R.id.text_gamma_label);
        textLength = findViewById(R.id.text_length_label);
        textDensity = findViewById(R.id.text_density_label);
        speedSeekBar = findViewById(R.id.speed_seekbar);

        Button btnRest = findViewById(R.id.btn_preset_rest);
        Button btnHalf = findViewById(R.id.btn_preset_half);
        Button btn99 = findViewById(R.id.btn_preset_99);
        Button btnLimit = findViewById(R.id.btn_preset_limit);

        // Initialize Chaquopy Python runtime
        initPython();

        // Setup Seekbar
        speedSeekBar.setOnSeekBarChangeListener(new SeekBar.OnSeekBarChangeListener() {
            @Override
            public void onProgressChanged(SeekBar seekBar, int progress, boolean fromUser) {
                if (fromUser) {
                    if (progress == 0) {
                        applySpeedFromPython(0.0);
                    } else if (progress >= 999) {
                        applyNinesFromPython(11);
                    } else {
                        double norm = progress / 1000.0;
                        double exponent = 11.0 * Math.pow(norm, 2.2);
                        double delta = Math.pow(10.0, -exponent);
                        double beta = Math.min(1.0 - delta, 0.99999999999);
                        applySpeedFromPython(beta);
                    }
                }
            }

            @Override
            public void onStartTrackingTouch(SeekBar seekBar) {}

            @Override
            public void onStopTrackingTouch(SeekBar seekBar) {}
        });

        // Setup Preset Buttons
        btnRest.setOnClickListener(v -> {
            speedSeekBar.setProgress(0);
            applySpeedFromPython(0.0);
        });

        btnHalf.setOnClickListener(v -> {
            speedSeekBar.setProgress(600);
            applySpeedFromPython(0.8660254);
        });

        btn99.setOnClickListener(v -> {
            speedSeekBar.setProgress(800);
            applySpeedFromPython(0.99);
        });

        btnLimit.setOnClickListener(v -> {
            speedSeekBar.setProgress(1000);
            applyNinesFromPython(11); // 0.99999999999 c
        });

        // Initial update
        applySpeedFromPython(0.8660254);
    }

    private void initPython() {
        try {
            if (!Python.isStarted()) {
                Python.start(new AndroidPlatform(this));
            }
            Python py = Python.getInstance();
            pyModule = py.getModule("main");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void applySpeedFromPython(double beta) {
        String jsonState = null;
        if (pyModule != null) {
            try {
                PyObject result = pyModule.callAttr("android_set_speed", beta);
                jsonState = result.toString();
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
        if (jsonState == null) {
            jsonState = fallbackComputeState(beta, -1);
        }
        updateUi(jsonState);
    }

    private void applyNinesFromPython(int nines) {
        String jsonState = null;
        if (pyModule != null) {
            try {
                PyObject result = pyModule.callAttr("android_set_nines", nines);
                jsonState = result.toString();
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
        if (jsonState == null) {
            jsonState = fallbackComputeState(1.0 - Math.pow(10, -nines), nines);
        }
        updateUi(jsonState);
    }

    private void updateUi(String jsonState) {
        try {
            surfaceView.updateStateFromJson(jsonState);

            JSONObject root = new JSONObject(jsonState);
            JSONObject metrics = root.getJSONObject("metrics");
            double beta = metrics.getDouble("beta");
            double gamma = metrics.getDouble("gamma");
            String formattedLength = metrics.getString("formatted_contracted_length");
            double density = metrics.getDouble("density_ratio");

            textSpeed.setText(String.format("β = %.5f c", beta));
            if (gamma >= 1000) {
                textGamma.setText(String.format("γ = %.2e", gamma));
            } else {
                textGamma.setText(String.format("γ = %.4f", gamma));
            }

            textLength.setText(String.format("Contracted Length L: %s (from 1.0000 m)", formattedLength));
            if (density >= 1000) {
                textDensity.setText(String.format("Atomic Packing: %.2ex density (Lattice compacted)", density));
            } else {
                textDensity.setText(String.format("Atomic Packing: %.2fx density (Lattice compacted)", density));
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    /**
     * Fallback computation in native Java if Python module is not yet initialized
     */
    private String fallbackComputeState(double beta, int forceNines) {
        double delta = forceNines > 0 ? Math.pow(10, -forceNines) : Math.max(1e-15, 1.0 - beta);
        double denom = delta * (2.0 - delta);
        double gamma = denom <= 0 ? 1e8 : 1.0 / Math.sqrt(denom);
        double L = 1.0 / gamma;

        try {
            JSONObject root = new JSONObject();
            JSONObject m = new JSONObject();
            m.put("beta", beta);
            m.put("gamma", gamma);
            m.put("motion_axis", "x");
            m.put("formatted_contracted_length", String.format("%.6f m", L));
            m.put("density_ratio", gamma);
            root.put("metrics", m);

            // 8 vertices for rest ghost and contracted cube
            double scaleX = Math.max(0.001, 1.0 / gamma);
            double h = 1.0;
            org.json.JSONArray cVerts = new org.json.JSONArray();
            org.json.JSONArray gVerts = new org.json.JSONArray();
            double[][] signs = {
                {-1,-1,-1}, {1,-1,-1}, {1,1,-1}, {-1,1,-1},
                {-1,-1,1}, {1,-1,1}, {1,1,1}, {-1,1,1}
            };
            for (double[] s : signs) {
                cVerts.put(new org.json.JSONArray(new double[]{s[0] * h * scaleX, s[1] * h, s[2] * h}));
                gVerts.put(new org.json.JSONArray(new double[]{s[0] * h, s[1] * h, s[2] * h}));
            }
            root.put("cube_vertices", cVerts);
            root.put("ghost_vertices", gVerts);
            root.put("atoms", new org.json.JSONArray());
            root.put("bonds", new org.json.JSONArray());
            return root.toString();
        } catch (Exception e) {
            return "{}";
        }
    }
}
