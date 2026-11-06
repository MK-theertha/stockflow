import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { apiFetch } from '@/lib/api-client';
import { Button, Box, Modal, TextField, CircularProgress, Typography } from '@mui/material';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '80%',
  height: '80%',
  bgcolor: 'black',
  border: '2px solid #000',
  boxShadow: 24,
  borderColor: ' blue',
  p: 4,
  overflowY: 'auto',
};

export default function Page() {
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleClick = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { text } = await apiFetch('/api/ai', { method: 'POST', body: { prompt: query } });
      setResponse(text);
      handleOpen();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard
      .writeText(response)
      .then(() => {
        alert('Response copied to clipboard!');
      })
      .catch((err) => {
        console.error('Could not copy text: ', err);
      });
  };

  return (
    <div className="container mt-5">
      <form onSubmit={handleClick}>
        <div className="mb-3">
          <TextField
            fullWidth
            label="Write something"
            variant="outlined"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            InputLabelProps={{
              style: { color: 'white' },
            }}
            sx={{
              mt: 2,
              input: { color: 'white' },
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: 'blue',
                },
                '&:hover fieldset': {
                  borderColor: 'blue',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'blue',
                },
              },
            }}
          />
        </div>
        <Button
          type="submit"
          variant="contained"
          sx={{
            m: 1,
            p: 2,
            backgroundColor: 'blue',
            ':hover': {
              backgroundColor: 'blue',
            },
            height: '100%',
            width: '100%',
          }}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {loading ? 'Loading...' : 'Generate with AI'}
        </Button>
      </form>

      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        <Box sx={style}>
          <Typography id="modal-title" variant="h6" component="h2">
            AI Response
          </Typography>
          <Box id="modal-description" sx={{ mt: 2 }}>
            {loading ? <CircularProgress /> : <ReactMarkdown>{response}</ReactMarkdown>}
          </Box>
          <Button
            onClick={copyToClipboard}
            color="primary"
            sx={{ mt: 2, mr: 2, backgroundColor: 'blue', color: 'white' }}
          >
            Copy to Clipboard
          </Button>
          <Button onClick={handleClose} variant="contained" color="secondary" sx={{ mt: 2 }}>
            Close
          </Button>
        </Box>
      </Modal>
    </div>
  );
}
