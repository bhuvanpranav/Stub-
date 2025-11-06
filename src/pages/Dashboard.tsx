import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { toast } from "sonner";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (!session) {
        navigate("/auth");
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-accent/20">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">STUB+ Dashboard</h1>
          <Button onClick={handleSignOut} variant="outline">
            Sign Out
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>My Tickets</CardTitle>
              <CardDescription>View and manage your ticket collection</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">No tickets yet. Start collecting!</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Collections</CardTitle>
              <CardDescription>Organize your tickets into collections</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Create your first collection</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>NFT Tickets</CardTitle>
              <CardDescription>Your blockchain-verified tickets</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">No NFT tickets yet</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Manage your account settings</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">Email: {user?.email}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Storage</CardTitle>
              <CardDescription>Upload concert photos and ticket designs</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Storage ready for uploads</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Marketplace</CardTitle>
              <CardDescription>Buy and sell verified tickets</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Coming soon</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
