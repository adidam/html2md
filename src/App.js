import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Grid,
  Paper,
  TextField,
  Button,
  Box,
  Divider,
  Alert,
  CircularProgress,
  CardContent,
  CardHeader,
  IconButton,
  Tooltip,
  Chip
} from '@mui/material';
import {
  Language as LanguageIcon,
  Preview as PreviewIcon,
  Download as DownloadIcon,
  ContentCopy as CopyIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import TurndownService from 'turndown';
import './App.css';
import logo from './logo.svg';

function App() {
  const [inputText, setInputText] = useState('');
  const [url, setUrl] = useState('');
  const [markdown, setMarkdown] = useState('');
  const [extractedHtml, setExtractedHtml] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // Initialize Turndown service for HTML to Markdown conversion
  const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced'
  });

  // Configure Turndown to handle common HTML elements
  turndownService.addRule('strikethrough', {
    filter: ['del', 's', 'strike'],
    replacement: function (content) {
      return '~~' + content + '~~';
    }
  });

  // Convert HTML to Markdown
  const convertHtmlToMarkdown = (html) => {
    try {
      return turndownService.turndown(html);
    } catch (err) {
      console.error('Error converting HTML to Markdown:', err);
      return 'Error converting HTML to Markdown';
    }
  };

  // Handle text input changes
  const handleTextChange = (e) => {
    const text = e.target.value;
    setInputText(text);
    
    if (text.trim()) {
      // Check if it looks like HTML
      if (text.includes('<') && text.includes('>')) {
        const markdownResult = convertHtmlToMarkdown(text);
        setMarkdown(markdownResult);
      } else {
        // If it's plain text, just display it as is
        setMarkdown(text);
      }
    } else {
      setMarkdown('');
    }
  };

  // Handle URL input changes
  const handleUrlChange = (e) => {
    setUrl(e.target.value);
  };

  // Fetch and process URL content
  const handleUrlSubmit = async () => {
    if (!url.trim()) return;

    setIsLoading(true);
    setError('');
    
    try {
      // Use a CORS proxy to fetch the URL content
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl);
      const data = await response.json();
      
      if (data.contents) {
        // Extract main content by removing navigation, menus, etc.
        const cleanedHtml = cleanHtmlContent(data.contents);
        setExtractedHtml(cleanedHtml);
        
        // Convert to markdown
        const markdownResult = convertHtmlToMarkdown(cleanedHtml);
        setMarkdown(markdownResult);
      } else {
        setError('Failed to fetch content from URL');
      }
    } catch (err) {
      console.error('Error fetching URL:', err);
      setError('Error fetching content from URL');
    } finally {
      setIsLoading(false);
    }
  };

  // Clean HTML content by removing navigation, menus, etc.
  const cleanHtmlContent = (html) => {
    // Create a temporary DOM element to parse HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Remove common navigation and menu elements
    const elementsToRemove = [
      'nav', 'header', 'footer', 'aside',
      '.navigation', '.menu', '.sidebar', '.header', '.footer',
      '.nav', '.navbar', '.breadcrumb', '.pagination',
      'script', 'style', 'noscript'
    ];
    
    elementsToRemove.forEach(selector => {
      const elements = doc.querySelectorAll(selector);
      elements.forEach(el => el.remove());
    });
    
    // Try to find the main content area
    let mainContent = doc.querySelector('main, .main, .content, .post, article, .article');
    
    if (!mainContent) {
      // If no main content found, use body
      mainContent = doc.body;
    }
    
    return mainContent ? mainContent.innerHTML : html;
  };

  // Copy markdown to clipboard
  const handleCopyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Download markdown as file
  const handleDownloadMarkdown = () => {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'converted.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Clear all inputs
  const handleClearAll = () => {
    setInputText('');
    setUrl('');
    setMarkdown('');
    setExtractedHtml('');
    setError('');
  };

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: 'grey.50' }}>
      <AppBar position="static" elevation={0} sx={{ bgcolor: 'primary.main' }}>
        <Toolbar>
          <Box 
            component="img" 
            src={logo} 
            alt="HTML to Markdown Converter Logo" 
            sx={{ 
              height: 40, 
              mr: 2,
              filter: 'brightness(0) invert(1)'
            }} 
          />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            HTML to Markdown Converter
          </Typography>
          <Chip 
            label="v1.0" 
            size="small" 
            sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
          />
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3}>
          {/* Input Section */}
          <Grid item xs={12} lg={6}>
            <Paper elevation={2} sx={{ p: 3, height: 'fit-content' }}>
              <CardHeader
                title={
                  <Box display="flex" alignItems="center" gap={1}>
                    <LanguageIcon color="primary" />
                    <Typography variant="h6">Input</Typography>
                  </Box>
                }
                action={
                  <Tooltip title="Clear All">
                    <IconButton onClick={handleClearAll} size="small">
                      <RefreshIcon />
                    </IconButton>
                  </Tooltip>
                }
              />
              
              <CardContent sx={{ pt: 0 }}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                    HTML Text Input
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={6}
                    variant="outlined"
                    placeholder="Paste HTML content here..."
                    value={inputText}
                    onChange={handleTextChange}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        fontFamily: 'Monaco, Menlo, Ubuntu Mono, monospace',
                        fontSize: '0.9rem'
                      }
                    }}
                  />
                </Box>

                <Divider sx={{ my: 2 }}>
                  <Chip label="OR" size="small" />
                </Divider>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                    URL Input
                  </Typography>
                  <Box display="flex" gap={1}>
                    <TextField
                      fullWidth
                      variant="outlined"
                      placeholder="https://example.com"
                      value={url}
                      onChange={handleUrlChange}
                      size="small"
                    />
                    <Button
                      variant="contained"
                      onClick={handleUrlSubmit}
                      disabled={isLoading || !url.trim()}
                      startIcon={isLoading ? <CircularProgress size={16} /> : <LanguageIcon />}
                      sx={{ minWidth: 120 }}
                    >
                      {isLoading ? 'Fetching...' : 'Fetch'}
                    </Button>
                  </Box>
                </Box>

                {error && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    {error}
                  </Alert>
                )}

                {extractedHtml && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                      Extracted HTML Content
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Paper 
                      variant="outlined" 
                      sx={{ 
                        p: 2, 
                        maxHeight: 200, 
                        overflow: 'auto',
                        bgcolor: 'grey.50'
                      }}
                    >
                      <pre style={{ 
                        margin: 0, 
                        fontSize: '0.8rem',
                        color: 'grey.700',
                        whiteSpace: 'pre-wrap',
                        wordWrap: 'break-word'
                      }}>
                        {extractedHtml}
                      </pre>
                    </Paper>
                  </Box>
                )}
              </CardContent>
            </Paper>
          </Grid>

          {/* Preview Section */}
          <Grid item xs={12} lg={6}>
            <Paper elevation={2} sx={{ p: 3, height: 'fit-content' }}>
              <CardHeader
                title={
                  <Box display="flex" alignItems="center" gap={1}>
                    <PreviewIcon color="primary" />
                    <Typography variant="h6">Markdown Preview</Typography>
                  </Box>
                }
                action={
                  <Box display="flex" gap={1}>
                    <Tooltip title="Copy Markdown">
                      <IconButton 
                        onClick={handleCopyMarkdown} 
                        size="small"
                        color={copied ? "success" : "default"}
                      >
                        <CopyIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Download Markdown">
                      <IconButton 
                        onClick={handleDownloadMarkdown} 
                        size="small"
                        disabled={!markdown}
                      >
                        <DownloadIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                }
              />
              
              <CardContent sx={{ pt: 0 }}>
                {markdown ? (
                  <Paper 
                    variant="outlined" 
                    sx={{ 
                      p: 3, 
                      minHeight: 400,
                      bgcolor: 'white',
                      textAlign: 'left'
                    }}
                  >
                    <div className="markdown-content">
                      {markdown.split('\n').map((line, index) => {
                        // Basic markdown rendering
                        if (line.startsWith('# ')) {
                          return <Typography key={index} variant="h4" sx={{ mb: 1, mt: 2 }}>{line.substring(2)}</Typography>;
                        } else if (line.startsWith('## ')) {
                          return <Typography key={index} variant="h5" sx={{ mb: 1, mt: 1.5 }}>{line.substring(3)}</Typography>;
                        } else if (line.startsWith('### ')) {
                          return <Typography key={index} variant="h6" sx={{ mb: 1, mt: 1 }}>{line.substring(4)}</Typography>;
                        } else if (line.startsWith('**') && line.endsWith('**')) {
                          return <Typography key={index} variant="body1" sx={{ mb: 0.5 }}><strong>{line.substring(2, line.length - 2)}</strong></Typography>;
                        } else if (line.startsWith('*') && line.endsWith('*')) {
                          return <Typography key={index} variant="body1" sx={{ mb: 0.5 }}><em>{line.substring(1, line.length - 1)}</em></Typography>;
                        } else if (line.startsWith('`') && line.endsWith('`')) {
                          return <code key={index} style={{ 
                            background: '#f5f5f5', 
                            padding: '2px 6px', 
                            borderRadius: '4px',
                            fontFamily: 'Monaco, Menlo, Ubuntu Mono, monospace',
                            fontSize: '0.9rem'
                          }}>{line.substring(1, line.length - 1)}</code>;
                        } else if (line.startsWith('- ')) {
                          return <Typography key={index} variant="body1" sx={{ mb: 0.5, ml: 2 }}>• {line.substring(2)}</Typography>;
                        } else if (line.trim() === '') {
                          return <Box key={index} sx={{ height: 8 }} />;
                        } else {
                          return <Typography key={index} variant="body1" sx={{ mb: 0.5 }}>{line}</Typography>;
                        }
                      })}
                    </div>
                  </Paper>
                ) : (
                  <Paper 
                    variant="outlined" 
                    sx={{ 
                      p: 3, 
                      minHeight: 400,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: 'grey.50'
                    }}
                  >
                    <Box textAlign="center" color="grey.500">
                      <PreviewIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                      <Typography variant="body1" color="textSecondary">
                        Enter HTML text or a URL to see the markdown preview
                      </Typography>
                    </Box>
                  </Paper>
                )}
              </CardContent>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

export default App;
