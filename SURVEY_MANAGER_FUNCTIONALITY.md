# Survey Manager - Functionality Documentation

## Overview
The Survey Manager module is a comprehensive instrument management system designed for monitoring and controlling survey instruments in pipeline inspection operations. It provides real-time tracking, health monitoring, alerts management, and detailed reporting capabilities.

---

## 📊 Dashboard (Survey Dashboard)

### **Main Features:**

#### **1. Overview Statistics**
- **Total Instruments**: Display total number of instruments in the system
- **Active Instruments**: Count of currently active instruments with real-time status
- **Inactive Instruments**: Count of instruments that are offline or not in use
- **In Godown**: Number of instruments stored in warehouse/storage
- **With Surveyors**: Instruments currently assigned to field surveyors

#### **2. Location/Zone Filtering**
- **Zone Selection**: Filter data by specific pipeline zones (Zone A, B, C, D, Godown)
- **Real-time Updates**: Live sync status showing last synchronization time
- **Geographic Context**: Location-based filtering for targeted monitoring

#### **3. Interactive Heatmap**
- **Location Analytics**: Visual representation of instrument activity across zones
- **Heat Intensity**: Color-coded activity levels showing usage patterns
- **Geographic Distribution**: Spatial analysis of instrument deployment

#### **4. Real-time Alerts Panel**
- **Critical Alerts**: Battery levels below 15% for DA2 devices
- **Warning Alerts**: Android controller issues (battery < 25%, overheating, memory)
- **Health Monitoring**: Device health status (Critical, Warning, Fair, Good)
- **Alert Categorization**: Separate tracking for DA2 and Android controller issues
- **Instrument Context**: Each alert shows instrument ID, device type, battery level, and health status

#### **5. Usage Analytics**
- **7-Day Trend**: Line chart showing surveys completed, instruments used, and efficiency
- **Performance Metrics**: 
  - Daily survey completion rates
  - Instrument utilization statistics
  - Operational efficiency percentages
- **Historical Data**: Week-over-week performance comparison

#### **6. Sync Status Monitoring**
- **Global Connectivity**: Overall system synchronization status
- **Last Sync Time**: Timestamp of most recent successful sync
- **Sync Coverage**: Number of instruments successfully synchronized vs total

---

## 📋 Instrument List

### **Main Features:**

#### **1. Comprehensive Search & Filtering**
- **Text Search**: Search by Instrument ID, Serial Number, or Assigned Surveyor name
- **Status Filter**: Filter by Active/Inactive status
- **Location Filter**: Filter by Godown, Surveyor, or In Use status
- **Real-time Results**: Instant filtering as user types

#### **2. Detailed Instrument Information**
- **Instrument ID**: Unique identifier for each device
- **Serial Number**: Hardware serial number tracking
- **Model Information**: Device model specifications
- **Assigned Surveyor**: Current person responsible for the instrument
- **Location Status**: Current location (Godown/Surveyor/In Use)
- **Activity Status**: Real-time active/inactive status with visual indicators

#### **3. Real-time Status Monitoring**
- **Sync Status**: Last synchronization time with connectivity indicators
- **Battery Monitoring**: 
  - Battery percentage with color-coded warnings (Red < 20%, Orange < 50%, Green ≥ 50%)
  - Visual battery icons reflecting charge levels
- **Health Assessment**: Device health badges (Good/Warning/Critical)
- **Usage Tracking**: Total usage hours for each instrument

#### **4. Connectivity Indicators**
- **Wifi Status**: Connected (green) vs disconnected (red) indicators
- **Sync Freshness**: Recent sync (< 1 hour) vs stale data indicators
- **Network Health**: Visual representation of communication status

#### **5. Management Actions**
- **Export Functionality**: Download instrument list as CSV/Excel
- **Quick Actions**: View detailed information for each instrument
- **Bulk Operations**: Support for multiple instrument operations

#### **6. Data Presentation**
- **Responsive Table**: Optimized for desktop and mobile viewing
- **Sortable Columns**: Click-to-sort functionality
- **Pagination Support**: Handle large datasets efficiently
- **Visual Status Indicators**: Color-coded status dots and badges

---

## 🗺️ Heatmap View

### **Main Features:**

#### **1. Location-based Analytics**
- **Geographic Visualization**: Interactive map showing instrument locations
- **Activity Heatmaps**: Color-coded intensity based on usage patterns
- **Zone Coverage**: Visual representation of instrument distribution across pipeline zones

#### **2. Interactive Features**
- **Zoom Controls**: Detailed view of specific geographic areas
- **Layer Controls**: Toggle different data layers (activity, battery status, health)
- **Click Interactions**: Detailed information on map markers

#### **3. Real-time Data Integration**
- **Live Updates**: Real-time instrument position tracking
- **Status Overlays**: Visual indicators for instrument health and connectivity
- **Dynamic Filtering**: Filter map data based on time ranges or status criteria

---

## 🚨 Alerts & Notifications

### **Main Features:**

#### **1. Alert Overview Dashboard**
- **Summary Cards**: Total alerts, Critical count, Warning count, Resolved count
- **Real-time Counters**: Live updating alert statistics
- **Severity Distribution**: Visual breakdown of alert types

#### **2. Comprehensive Alert Types**
- **DA2 Device Alerts**:
  - Battery Critical (< 15%)
  - Battery Warning (< 20%)
  - Health status critical
  - Device malfunction warnings
- **Android Controller Alerts**:
  - Battery warnings (< 25%)
  - Overheating detection
  - Memory usage warnings
  - Performance degradation alerts

#### **3. Advanced Filtering System**
- **Device Type Filter**: Filter by DA2 or Android controller
- **Zone Filter**: Filter alerts by geographic zones
- **Severity Filter**: Filter by Critical, Warning, or Info levels
- **Status Filter**: View active vs resolved alerts

#### **4. Alert Management**
- **Resolution Tracking**: Mark alerts as resolved with timestamps
- **Alert History**: Maintain record of past alerts and resolutions
- **Escalation System**: Priority-based alert handling
- **Notification Export**: Export alert data for reporting

#### **5. Detailed Alert Information**
- **Instrument Context**: Instrument ID, zone, assigned surveyor
- **Technical Details**: Battery level, health status, device type
- **Temporal Data**: Alert timestamp and duration
- **Resolution Actions**: One-click resolution with audit trail

#### **6. Visual Alert Presentation**
- **Color-coded Severity**: Red (Critical), Orange (Warning), Blue (Info)
- **Card-based Layout**: Easy-to-scan alert cards with all relevant information
- **Status Indicators**: Visual distinction between active and resolved alerts
- **Device Icons**: Clear differentiation between DA2 and Android alerts

---

## 📈 Reports & Analytics

### **Main Features:**

#### **1. Report Generation System**
- **Date Range Selection**: Custom start and end date picker
- **Multiple Report Types**:
  - **Inventory Report**: Complete instrument inventory with status and locations
  - **Daily Usage Report**: Daily instrument usage statistics and patterns
  - **Monthly Usage Report**: Monthly usage summary with trends and insights
  - **Downtime Report**: Analysis of instrument downtime and maintenance needs

#### **2. Format Options**
- **PDF Reports**: Formatted professional reports for presentations
- **CSV Exports**: Raw data for further analysis
- **Excel Spreadsheets**: Structured data with charts and formatting

#### **3. Recent Reports Management**
- **Report History**: List of previously generated reports
- **Download Access**: Quick download of existing reports
- **Report Metadata**: 
  - Generation date and time
  - File size and format
  - Date range covered
  - Report type classification

#### **4. Report Analytics**
- **Usage Statistics**: Track most frequently generated reports
- **Generation Metrics**: Monthly report generation counts
- **Storage Management**: Total storage usage tracking
- **Popular Reports**: Identify most requested report types

#### **5. Report Descriptions**
- **Inventory Report**: 
  - Complete instrument inventory
  - Status and location tracking
  - Available in PDF, CSV, Excel formats
- **Daily Usage Report**: 
  - Daily instrument usage patterns
  - Surveyor activity tracking
  - Available in PDF, CSV formats
- **Monthly Usage Report**: 
  - Monthly usage trends
  - Performance insights
  - Available in PDF, Excel formats
- **Downtime Report**: 
  - Maintenance analysis
  - Downtime pattern identification
  - Available in PDF, CSV formats

#### **6. Quick Statistics**
- **Total Reports Generated**: Historical count of all reports
- **Monthly Generation**: Current month's report activity
- **Most Popular Type**: Most frequently requested report category
- **Storage Usage**: Total file storage utilization

---

## 🔧 Technical Features

### **1. Real-time Data Synchronization**
- WebSocket connections for live updates
- Automatic refresh intervals
- Offline mode support with sync queuing

### **2. Responsive Design**
- Mobile-optimized layouts
- Touch-friendly interactions
- Adaptive grid systems

### **3. Data Export Capabilities**
- CSV/Excel export functionality
- PDF report generation
- Batch export operations

### **4. User Interface Components**
- Consistent design system
- Color-coded status indicators
- Interactive charts and graphs
- Modal dialogs for detailed views

### **5. Performance Optimization**
- Lazy loading for large datasets
- Efficient filtering algorithms
- Cached data management
- Optimistic UI updates

---

## 🎯 User Workflows

### **1. Daily Monitoring Workflow**
1. Check Dashboard for overview statistics
2. Review active alerts in Alerts & Notifications
3. Monitor instrument status via Instrument List
4. Analyze geographic distribution using Heatmap View

### **2. Report Generation Workflow**
1. Access Reports & Analytics section
2. Select desired report type and date range
3. Generate report in preferred format
4. Download and distribute as needed

### **3. Alert Response Workflow**
1. Receive alert notification
2. Review alert details in Alerts & Notifications
3. Take corrective action (battery replacement, maintenance)
4. Mark alert as resolved with notes

### **4. Instrument Management Workflow**
1. Search/filter instruments in Instrument List
2. View detailed instrument information
3. Track usage patterns and health status
4. Schedule maintenance based on analytics

---

## 📱 Integration Points

### **1. Hardware Integration**
- DA2 device communication protocols
- Android controller data synchronization
- Battery level monitoring APIs
- Health status reporting systems

### **2. Backend Services**
- Real-time data processing
- Alert generation engines
- Report generation services
- Data archival systems

### **3. External Systems**
- GIS mapping services for heatmap visualization
- Email/SMS notification systems
- File storage systems for reports
- Authentication and authorization services

---

This documentation covers all major functionalities of the Survey Manager system, providing a comprehensive guide for users and administrators to understand and utilize the full capabilities of the platform.