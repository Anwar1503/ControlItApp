import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  TextField,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { Trash2 as DeleteIcon, Upload as UploadIcon } from "lucide-react";
import { API_BASE } from "../config/api";
import axios from "axios";

const AdminContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
}));

const UploadCard = styled(Card)(({ theme }) => ({
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "16px",
  marginBottom: theme.spacing(3),
}));

const UploadButton = styled(Button)(({ theme }) => ({
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  color: "white",
  textTransform: "none",
  fontWeight: 600,
  padding: "10px 20px",
  borderRadius: "8px",

  "&:hover": {
    background: "linear-gradient(135deg, #5568d3 0%, #65398a 100%)",
  },

  "&:disabled": {
    background: "rgba(255,255,255,0.1)",
    color: "rgba(255,255,255,0.5)",
  },
}));

const DeleteButton = styled(IconButton)(({ theme }) => ({
  color: "#f87171",
  "&:hover": {
    backgroundColor: "rgba(248, 113, 113, 0.1)",
  },
}));

interface Download {
  id: string;
  name: string;
  version: string;
  size: string;
  description: string;
  uploadedDate: string;
  uploadedBy: string;
}

const DownloadsManagement: React.FC = () => {
  const [downloads, setDownloads] = useState<Download[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Upload dialog states
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadName, setUploadName] = useState("");
  const [uploadVersion, setUploadVersion] = useState("");
  const [uploadDescription, setUploadDescription] = useState("");

  useEffect(() => {
    fetchDownloads();
  }, []);

  const fetchDownloads = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_BASE}/api/downloads`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.status === "success") {
        setDownloads(response.data.downloads);
        setError(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load downloads");
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !uploadName || !uploadVersion) {
      setError("Please fill in all required fields and select a file");
      return;
    }

    try {
      setUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("name", uploadName);
      formData.append("version", uploadVersion);
      formData.append("description", uploadDescription);

      const token = localStorage.getItem("token");
      const response = await axios.post(`${API_BASE}/api/admin/uploads/add`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.status === "success") {
        setSuccess("Download uploaded successfully!");
        setUploadDialogOpen(false);
        setSelectedFile(null);
        setUploadName("");
        setUploadVersion("");
        setUploadDescription("");
        fetchDownloads();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (downloadId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.delete(`${API_BASE}/api/admin/uploads/${downloadId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.status === "success") {
        setSuccess("Download deleted successfully!");
        fetchDownloads();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete download");
    }
  };

  const handleCloseDialog = () => {
    setUploadDialogOpen(false);
    setSelectedFile(null);
    setUploadName("");
    setUploadVersion("");
    setUploadDescription("");
  };

  return (
    <AdminContainer>
      <Typography
        variant="h5"
        sx={{
          fontWeight: "700",
          mb: 3,
          color: "white",
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <UploadIcon size={24} />
        Manage Downloads
      </Typography>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <UploadCard>
        <CardContent sx={{ p: 3 }}>
          <Button
            variant="contained"
            onClick={() => setUploadDialogOpen(true)}
            startIcon={<UploadIcon size={20} />}
            sx={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              textTransform: "none",
              fontWeight: 600,
              padding: "10px 20px",
              borderRadius: "8px",
            }}
          >
            Upload New Version
          </Button>
        </CardContent>
      </UploadCard>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "300px" }}>
          <CircularProgress />
        </Box>
      ) : downloads.length === 0 ? (
        <Typography sx={{ color: "rgba(255,255,255,0.6)", textAlign: "center", py: 4 }}>
          No downloads available. Upload one to get started!
        </Typography>
      ) : (
        <TableContainer component={Paper} sx={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <Table>
            <TableHead>
              <TableRow sx={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                <TableCell sx={{ color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>Name</TableCell>
                <TableCell sx={{ color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>Version</TableCell>
                <TableCell sx={{ color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>Size</TableCell>
                <TableCell sx={{ color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>Uploaded</TableCell>
                <TableCell sx={{ color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {downloads.map((download) => (
                <TableRow key={download.id} sx={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <TableCell sx={{ color: "white" }}>{download.name}</TableCell>
                  <TableCell sx={{ color: "rgba(255,255,255,0.7)" }}>v{download.version}</TableCell>
                  <TableCell sx={{ color: "rgba(255,255,255,0.7)" }}>{download.size}</TableCell>
                  <TableCell sx={{ color: "rgba(255,255,255,0.7)" }}>
                    {new Date(download.uploadedDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Delete">
                      <DeleteButton
                        size="small"
                        onClick={() => handleDelete(download.id, download.name)}
                      >
                        <DeleteIcon size={18} />
                      </DeleteButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Upload Dialog */}
      <Dialog
        open={uploadDialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: "rgba(20, 20, 35, 0.95)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "12px",
          },
        }}
      >
        <DialogTitle sx={{ color: "white", fontWeight: "700", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          Upload New Download
        </DialogTitle>
        <DialogContent sx={{ color: "rgba(255,255,255,0.8)", pt: 3, display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            fullWidth
            label="Name"
            value={uploadName}
            onChange={(e) => setUploadName(e.target.value)}
            placeholder="e.g., ControlIt Agent"
            sx={{
              "& .MuiInputBase-root": {
                backgroundColor: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                color: "white",
              },
              "& .MuiInputLabel-root": {
                color: "rgba(255,255,255,0.6)",
              },
            }}
          />

          <TextField
            fullWidth
            label="Version"
            value={uploadVersion}
            onChange={(e) => setUploadVersion(e.target.value)}
            placeholder="e.g., 1.0.0"
            sx={{
              "& .MuiInputBase-root": {
                backgroundColor: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                color: "white",
              },
              "& .MuiInputLabel-root": {
                color: "rgba(255,255,255,0.6)",
              },
            }}
          />

          <TextField
            fullWidth
            label="Description (Optional)"
            value={uploadDescription}
            onChange={(e) => setUploadDescription(e.target.value)}
            placeholder="e.g., Initial release with core features"
            multiline
            rows={3}
            sx={{
              "& .MuiInputBase-root": {
                backgroundColor: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                color: "white",
              },
              "& .MuiInputLabel-root": {
                color: "rgba(255,255,255,0.6)",
              },
            }}
          />

          <Box
            sx={{
              border: "2px dashed rgba(255,255,255,0.2)",
              borderRadius: "8px",
              p: 2,
              textAlign: "center",
              cursor: "pointer",
              transition: "all 0.3s",
              "&:hover": {
                borderColor: "rgba(102, 126, 234, 0.5)",
                backgroundColor: "rgba(102, 126, 234, 0.05)",
              },
            }}
          >
            <input
              type="file"
              accept=".exe,.zip"
              onChange={handleFileSelect}
              style={{ display: "none" }}
              id="file-input"
            />
            <label htmlFor="file-input" style={{ cursor: "pointer", display: "block" }}>
              <UploadIcon size={32} style={{ margin: "0 auto", marginBottom: "8px", color: "rgba(102, 126, 234, 0.7)" }} />
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)" }}>
                Click to upload or drag and drop
              </Typography>
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)" }}>
                (.exe or .zip files only, max 500 MB)
              </Typography>
              {selectedFile && (
                <Typography variant="body2" sx={{ color: "#4ade80", mt: 1 }}>
                  ✓ {selectedFile.name}
                </Typography>
              )}
            </label>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <Button onClick={handleCloseDialog} disabled={uploading} sx={{ color: "rgba(255,255,255,0.6)" }}>
            Cancel
          </Button>
          <UploadButton onClick={handleUpload} disabled={uploading || !selectedFile || !uploadName || !uploadVersion}>
            {uploading ? <CircularProgress size={20} /> : "Upload"}
          </UploadButton>
        </DialogActions>
      </Dialog>
    </AdminContainer>
  );
};

export default DownloadsManagement;
