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

/**
 * Native Android Activity delegating UI events and physics logic directly
 * to the Chaquopy Python engine (main.py).
 */
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

        // 1. Initialize Python runtime
        initPython();

        // 2. Setup SeekBar listener -> Python
        speedSeekBar.setOnSeekBarChangeListener(new SeekBar.OnSeekBarChangeListener() {
            @Override
            public void onProgressChanged(SeekBar seekBar, int progress, boolean fromUser) {
                if (fromUser && pyModule != null) {
                    try {
                        PyObject res = pyModule.callAttr("android_on_slider_progress", progress);
                        updateMetricsUi(res.toString(), false);
                        surfaceView.invalidate();
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }
            }

            @Override
            public void onStartTrackingTouch(SeekBar seekBar) {}

            @Override
            public void onStopTrackingTouch(SeekBar seekBar) {}
        });

        // 3. Setup Presets -> Python
        btnRest.setOnClickListener(v -> callPythonPreset("rest"));
        btnHalf.setOnClickListener(v -> callPythonPreset("half"));
        btn99.setOnClickListener(v -> callPythonPreset("99"));
        btnLimit.setOnClickListener(v -> callPythonPreset("limit"));

        // 4. Initial state from Python
        if (pyModule != null) {
            try {
                PyObject initialMetrics = pyModule.callAttr("android_get_metrics");
                updateMetricsUi(initialMetrics.toString(), true);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }

    private void initPython() {
        try {
            if (!Python.isStarted()) {
                Python.start(new AndroidPlatform(this));
            }
            Python py = Python.getInstance();
            pyModule = py.getModule("main");
            if (surfaceView != null) {
                surfaceView.setPyModule(pyModule);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void callPythonPreset(String preset) {
        if (pyModule != null) {
            try {
                PyObject res = pyModule.callAttr("android_apply_preset", preset);
                updateMetricsUi(res.toString(), true);
                surfaceView.invalidate();
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }

    private void updateMetricsUi(String jsonMetrics, boolean updateSeekBar) {
        try {
            JSONObject m = new JSONObject(jsonMetrics);
            String formattedSpeed = m.optString("formatted_speed", "0.0 c");
            String formattedGamma = m.optString("formatted_gamma", "1.0000");
            String formattedLength = m.optString("formatted_contracted_length", "1.0000 m");
            double density = m.optDouble("density_ratio", 1.0);

            textSpeed.setText("β = " + formattedSpeed);
            textGamma.setText("γ = " + formattedGamma);
            textLength.setText("Contracted L: " + formattedLength + " (from 1.0000 m)");

            if (density >= 1000) {
                textDensity.setText(String.format("Atomic Packing: %.2ex density (Lattice compacted)", density));
            } else {
                textDensity.setText(String.format("Atomic Packing: %.2fx density (Lattice compacted)", density));
            }

            if (updateSeekBar && m.has("slider_progress")) {
                speedSeekBar.setProgress(m.getInt("slider_progress"));
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
