package com.mercyphall.inventariohogar;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;
import org.json.JSONObject;
import java.text.NumberFormat;
import java.util.Currency;

public class IDOcashWidgetProvider extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int widgetId : appWidgetIds) {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_idocash);
            update(context, views);
            setupClick(context, views);
            appWidgetManager.updateAppWidget(widgetId, views);
        }
    }

    private void update(Context context, RemoteViews views) {
        try {
            SharedPreferences prefs = context.getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE);
            String raw = prefs.getString("idocash_summary", null);
            if (raw == null) {
                views.setViewVisibility(R.id.widget_row, android.view.View.GONE);
                views.setViewVisibility(R.id.widget_house, android.view.View.GONE);
                views.setViewVisibility(R.id.widget_empty, android.view.View.VISIBLE);
                return;
            }
            JSONObject s = new JSONObject(raw);
            double sum = s.optDouble("sum", 0);
            String cur = s.optString("currency", "CLP");
            String name = s.optString("name", "Mi Hogar");
            int items = s.optInt("items", 0);
            views.setTextViewText(R.id.widget_amount, formatMoney(sum, cur));
            views.setTextViewText(R.id.widget_caption,
                    "PRESUPUESTO GLOBAL  ·  " + (items == 1 ? "1 ÍTEM" : items + " ÍTEMS"));
            views.setTextViewText(R.id.widget_house, name);
            views.setViewVisibility(R.id.widget_row, android.view.View.VISIBLE);
            views.setViewVisibility(R.id.widget_house, android.view.View.VISIBLE);
            views.setViewVisibility(R.id.widget_empty, android.view.View.GONE);
        } catch (Exception e) {
            views.setViewVisibility(R.id.widget_row, android.view.View.GONE);
            views.setViewVisibility(R.id.widget_house, android.view.View.GONE);
            views.setViewVisibility(R.id.widget_empty, android.view.View.VISIBLE);
        }
    }

    private String formatMoney(double value, String code) {
        try {
            NumberFormat nf = NumberFormat.getCurrencyInstance();
            nf.setCurrency(Currency.getInstance(code));
            return nf.format(value);
        } catch (Exception e) {
            return "$ " + Math.round(value);
        }
    }

    private void setupClick(Context context, RemoteViews views) {
        Intent intent = new Intent(context, MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pi = PendingIntent.getActivity(context, 0, intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        views.setOnClickPendingIntent(R.id.widget_row, pi);
        views.setOnClickPendingIntent(R.id.widget_empty, pi);
    }
}