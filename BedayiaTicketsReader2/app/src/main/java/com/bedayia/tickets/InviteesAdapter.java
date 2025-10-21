package com.bedayia.tickets;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.BaseAdapter;
import android.widget.CheckBox;
import android.widget.TextView;
import java.util.List;

public class InviteesAdapter extends BaseAdapter {
    private Context context;
    private List<Invitee> inviteesList;
    private LayoutInflater inflater;
    private OnAttendanceChangeListener attendanceChangeListener;

    public interface OnAttendanceChangeListener {
        void onAttendanceChanged();
    }

    public InviteesAdapter(Context context, List<Invitee> inviteesList, OnAttendanceChangeListener listener) {
        this.context = context;
        this.inviteesList = inviteesList;
        this.inflater = LayoutInflater.from(context);
        this.attendanceChangeListener = listener;
    }

    @Override
    public int getCount() {
        return inviteesList.size();
    }

    @Override
    public Invitee getItem(int position) {
        return inviteesList.get(position);
    }

    @Override
    public long getItemId(int position) {
        return position;
    }

    @Override
    public View getView(int position, View convertView, ViewGroup parent) {
        ViewHolder holder;
    
        if (convertView == null) {
            convertView = inflater.inflate(R.layout.item_invitee, parent, false);
            holder = new ViewHolder();
            holder.nameTextView = convertView.findViewById(R.id.invitee_name);
            holder.attendanceCheckBox = convertView.findViewById(R.id.attendance_checkbox);
            holder.attendanceTimeTextView = convertView.findViewById(R.id.attendance_time);
            convertView.setTag(holder);
        } else {
            holder = (ViewHolder) convertView.getTag();
        }
    
        Invitee invitee = getItem(position);
    
        holder.nameTextView.setText(invitee.getInviteesName());
    
        // Remove listener before changing checked state
        holder.attendanceCheckBox.setOnCheckedChangeListener(null);
        holder.attendanceCheckBox.setChecked(invitee.isInviteesAttendance());
    
        // Make checkbox read-only if attendance is already true
        boolean isReadOnly = invitee.isInviteesAttendance();
        holder.attendanceCheckBox.setEnabled(!isReadOnly);
    
        if (invitee.getInviteesAttendanceTime() != null && !invitee.getInviteesAttendanceTime().equals("false")) {
            holder.attendanceTimeTextView.setText("Time: " + invitee.getInviteesAttendanceTime());
            holder.attendanceTimeTextView.setVisibility(View.VISIBLE);
        } else {
            holder.attendanceTimeTextView.setVisibility(View.GONE);
        }
    
        // Only set listener if not read-only
        if (!isReadOnly) {
            holder.attendanceCheckBox.setOnCheckedChangeListener((buttonView, isChecked) -> {
                invitee.setInviteesAttendance(isChecked);
                if (attendanceChangeListener != null) {
                    attendanceChangeListener.onAttendanceChanged();
                }
            });
        }
    
        return convertView;
    }

    private static class ViewHolder {
        TextView nameTextView;
        CheckBox attendanceCheckBox;
        TextView attendanceTimeTextView;
    }
} 