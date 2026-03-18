import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  CircularProgress,
  Alert,
  LinearProgress,
  Chip,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { Download as DownloadIcon } from "lucide-react";
import Navbar from "./Navbar";
import { API_BASE } from "../config/api";
import axios from "axios";

const DownloadsContainer = styled(Box)(({ theme }) => ({
  background: "linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 100%)",
  minHeight: "100vh",
  padding: theme.spacing(3),
  color: "white",
}));

const PageHeader = styled(Box)(({ theme }) => ({
  marginBottom: "40px",
}));

const PageTitle = styled(Typography)({
  fontSize: "32px",
  fontWeight: 800,
  letterSpacing: "-0.02em",
  color: "#f1f5f9",
  marginBottom: "8px",
});

const PageSubtitle = styled(Typography)({
  fontSize: "16px",
  color: "rgba(255,255,255,0.6)",
});

const DownloadCard = styled(Card)(({ theme }) => ({
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "16px",
  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  padding: "24px",
  height: "100%",

  "&:hover": {
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(102, 126, 234, 0.4)",
    boxShadow: "0 10px 30px rgba(102, 126, 234, 0.15)",
  },
}));

const DownloadButton = styled(Button)(({ theme }) => ({
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  color: "white",
  textTransform: "none",
  fontWeight: 600,
  padding: "10px 20px",
  borderRadius: "8px",
  marginTop: "16px",

  "&:hover": {
    background: "linear-gradient(135deg, #5568d3 0%, #65398a 100%)",
  },

  "&:disabled": {
    background: "rgba(255,255,255,0.1)",
    color: "rgba(255,255,255,0.5)",
  },
}));

const CenteredBox = styled(Box)({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "50vh",
  gap: "16px",
});

interface Download {
  id: string;
  name: string;
  version: string;
  size: string;
  uploadedDate: string;
  description?: string;
}

const Downloads: React.FC = () => {
  const [downloads, setDownloads] = useState<Download[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    fetchDownloads();
  }, []);

  const fetchDownloads = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Not authenticated");
        return;
      }

      const response = await axios.get(`${API_BASE}/api/downloads`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.status === "success") {
        setDownloads(response.data.downloads || []);
        setError(null);
      } else {
        setError("Failed to load downloads");
      }
    } catch (err: any) {
      console.error("Error fetching downloads:", err);
      setError(err.response?.data?.message || "Failed to load downloads");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (download: Download) => {
    try {
      setDownloading(download.id);
      const token = localStorage.getItem("token");

      const response = await axios.get(`${API_BASE}/api/downloads/${download.id}/file`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      });

      // Create a blob URL and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${download.name}.exe`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error("Error downloading file:", err);
      setError("Failed to download file. Please try again.");
    } finally {
      setDownloading(null);
    }
  };

  return (
    <DownloadsContainer>
      <Navbar />

      <PageHeader>
        <PageTitle>Downloads</PageTitle>
        <PageSubtitle>Download the ControlIt agent application</PageSubtitle>
      </PageHeader>

      {error && (
        <Alert
          severity="error"
          onClose={() => setError(null)}
          sx={{
            mb: 3,
            backgroundColor: "rgba(244, 67, 54, 0.1)",
            border: "1px solid rgba(244, 67, 54, 0.3)",
            color: "rgba(244, 67, 54, 0.9)",
          }}
        >
          {error}
        </Alert>
      )}

      {loading ? (
        <CenteredBox>
          <CircularProgress sx={{ color: "#667eea" }} />
          <Typography sx={{ color: "rgba(255,255,255,0.6)" }}>
            Loading downloads...
          </Typography>
        </CenteredBox>
      ) : downloads.length === 0 ? (
        <CenteredBox>
          <DownloadIcon style={{ width: "48px", height: "48px", color: "rgba(255,255,255,0.3)" }} />
          <Typography sx={{ color: "rgba(255,255,255,0.6)", fontSize: "16px" }}>
            No downloads available at the moment
          </Typography>
        </CenteredBox>
      ) : (
        <Grid container spacing={3}>
          {downloads.map((download) => (
            <Grid item xs={12} sm={6} md={4} key={download.id}>
              <DownloadCard>
                <CardContent sx={{ p: 0 }}>
                  <Box sx={{ display: "flex", alignItems: "start", justifyContent: "space-between", mb: 2 }}>
                    <Box>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          color: "white",
                          mb: 0.5,
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                        }}
                      >
                        <DownloadIcon size={20} />
                        {download.name}
                      </Typography>
                      <Chip
                        label={`v${download.version}`}
                        size="small"
                        sx={{
                          backgroundColor: "rgba(102, 126, 234, 0.2)",
                          color: "#a5b4fc",
                          fontWeight: 600,
                        }}
                      />
                    </Box>
                  </Box>

                  {download.description && (
                    <Typography
                      variant="body2"
                      sx={{
                        color: "rgba(255,255,255,0.6)",
                        mb: 2,
                        lineHeight: 1.5,
                      }}
                    >
                      {download.description}
                    </Typography>
                  )}

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 2,
                      fontSize: "13px",
                      color: "rgba(255,255,255,0.5)",
                    }}
                  >
                    <span>📦 {download.size}</span>
                    <span>📅 {new Date(download.uploadedDate).toLocaleDateString()}</span>
                  </Box>

                  <DownloadButton
                    fullWidth
                    onClick={() => handleDownload(download)}
                    disabled={downloading === download.id}
                    startIcon={downloading === download.id ? <CircularProgress size={18} /> : <DownloadIcon size={18} />}
                  >
                    {downloading === download.id ? "Downloading..." : "Download"}
                  </DownloadButton>
                </CardContent>
              </DownloadCard>
            </Grid>
          ))}
        </Grid>
      )}
    </DownloadsContainer>
  );
};

export default Downloads;
