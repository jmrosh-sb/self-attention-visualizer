// App.tsx

import React, { useState, useEffect } from 'react';
import {
  Container,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Typography,
  Box,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Edit, Delete, Visibility, Save } from '@mui/icons-material';
import api from './api';
import Visualization from './Visualization';
import { MathJaxContext } from 'better-react-mathjax';

const mathJaxConfig = {
  loader: { load: ['[tex]/ams'] },
  tex: {
    packages: { '[+]': ['ams'] },
    inlineMath: [['$', '$'], ['\\(', '\\)']],
    displayMath: [['$$', '$$'], ['\\[', '\\]']],
  },
};

function App() {
  const [text, setText] = useState('');
  const [tokensCount, setTokensCount] = useState(0);
  const [savedTexts, setSavedTexts] = useState<any[]>([]);
  const [attentionData, setAttentionData] = useState<any>(null);
  const [visualizationText, setVisualizationText] = useState('');
  const [visualizationTokens, setVisualizationTokens] = useState<string[]>([]);
  const [visualizationAttention, setVisualizationAttention] = useState<number[][]>([]);
  const [isVisualizing, setIsVisualizing] = useState(false);
  const [editTextId, setEditTextId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    fetchSavedTexts();
  }, []);

  const fetchSavedTexts = async () => {
    try {
      const response = await api.get('/api/texts');
      setSavedTexts(response.data || []);
    } catch (error) {
      console.error('Error fetching saved texts:', error);
      setSavedTexts([]);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputText = e.target.value;
    setText(inputText);
    setTokensCount(inputText.trim() === '' ? 0 : inputText.trim().split(/\s+/).length);
  };

  const handleVisualize = async () => {
    try {
      const response = await api.post('/api/visualize', { text });
      setVisualizationText(text);
      setVisualizationTokens(text.trim().split(/\s+/));
      setVisualizationAttention(response.data);
      setIsVisualizing(true);
    } catch (error) {
      console.error('Error visualizing text:', error);
    }
  };

  const handleSave = async () => {
    if (text.trim() === '' || tokensCount > 100) {
      alert('Text cannot be empty or exceed 100 tokens.');
      return;
    }
    try {
      await api.post('/api/texts', { text });
      fetchSavedTexts();
      setText('');
      setTokensCount(0);
    } catch (error) {
      console.error('Error saving text:', error);
    }
  };

  const handleView = async (item: any) => {
    try {
      const response = await api.post('/api/visualize', { text: item.text });
      setVisualizationText(item.text);
      setVisualizationTokens(item.text.trim().split(/\s+/));
      setVisualizationAttention(response.data);
      setIsVisualizing(true);
    } catch (error) {
      console.error('Error visualizing text:', error);
    }
  };

  const handleEdit = (item: any) => {
    setEditTextId(item.id);
    setEditText(item.text);
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (editText.trim() === '' || editText.trim().split(/\s+/).length > 100) {
      alert('Text cannot be empty or exceed 100 tokens.');
      return;
    }
    try {
      await api.put(`/api/texts/${editTextId}`, { text: editText });
      fetchSavedTexts();
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Error updating text:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/api/texts/${id}`);
      fetchSavedTexts();
    } catch (error) {
      console.error('Error deleting text:', error);
    }
  };

  const handleCloseVisualization = () => {
    setIsVisualizing(false);
    setVisualizationText('');
    setVisualizationTokens([]);
    setVisualizationAttention([]);
  };

  return (
    <MathJaxContext config={mathJaxConfig}>
      <Container>
        <Typography variant="h4" gutterBottom>
          Self-Attention Visualizer
        </Typography>
        <Box sx={{ marginBottom: 2 }}>
          <TextField
            label="Enter Text"
            multiline
            rows={4}
            fullWidth
            value={text}
            onChange={handleTextChange}
            helperText={`Tokens: ${tokensCount} / 100`}
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 1, marginBottom: 2 }}>
          <Button
            variant="contained"
            onClick={handleVisualize}
            disabled={tokensCount === 0 || tokensCount > 100}
          >
            Visualize
          </Button>
          <Button
            variant="outlined"
            onClick={handleSave}
            disabled={tokensCount === 0 || tokensCount > 100}
            startIcon={<Save />}
          >
            Save
          </Button>
        </Box>

        {isVisualizing && (
          <Box sx={{ marginBottom: 4 }}>
            <Typography variant="h5" gutterBottom>
              Visualization
            </Typography>
            <Visualization tokens={visualizationTokens} attention={visualizationAttention} />
            <Button variant="contained" onClick={handleCloseVisualization}>
              Close Visualization
            </Button>
          </Box>
        )}

        <Typography variant="h5" gutterBottom>
          Saved Texts
        </Typography>
        <List>
          {savedTexts && savedTexts.length > 0 ? (
            savedTexts.map((item) => (
              <ListItem
                key={item.id}
                secondaryAction={
                  <Box>
                    <IconButton edge="end" aria-label="view" onClick={() => handleView(item)}>
                      <Visibility />
                    </IconButton>
                    <IconButton edge="end" aria-label="edit" onClick={() => handleEdit(item)}>
                      <Edit />
                    </IconButton>
                    <IconButton edge="end" aria-label="delete" onClick={() => handleDelete(item.id)}>
                      <Delete />
                    </IconButton>
                  </Box>
                }
              >
                <ListItemText primary={item.text} />
              </ListItem>
            ))
          ) : (
            <Typography>No saved texts yet.</Typography>
          )}
        </List>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onClose={() => setIsEditDialogOpen(false)}>
          <DialogTitle>Edit Text</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Text"
              type="text"
              fullWidth
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              helperText={`Tokens: ${
                editText.trim() === '' ? 0 : editText.trim().split(/\s+/).length
              } / 100`}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdate}>Update</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </MathJaxContext>
  );
}

export default App;

