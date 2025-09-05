import { Helmet } from "react-helmet-async";
import AdminDashboard from "@/components/admin/AdminDashboard";
// ApiStatusBanner intentionally hidden per requirements

export default function Admin() {
  return (
    <>
      <Helmet>
        <title>Admin Dashboard - Pipeline Management System</title>
        <meta name="description" content="Administrative dashboard for managing survey categories, surveys, devices, and attributes" />
      </Helmet>
      <div className="min-h-screen bg-background">
        {/* Status banner hidden as requested */}
        <AdminDashboard />
      </div>
    </>
  );
}
