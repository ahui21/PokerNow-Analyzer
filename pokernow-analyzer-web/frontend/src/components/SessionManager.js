import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Box,
  Typography,
  Divider
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';

const SessionManager = ({ 
  open, 
  onClose, 
  sessions, 
  onDeleteSession,
  onSelectSession 
}) => {
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>Manage Sessions</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" color="text.secondary">
            {sessions.length} sessions total
          </Typography>
        </Box>
        <List>
          {sessions.map((session) => (
            <React.Fragment key={session.id}>
              <ListItem>
                <ListItemText
                  primary={session.display_name}
                  secondary={
                    <Typography variant="body2" color="text.secondary">
                      Upload Date: {new Date(session.upload_date).toLocaleString()}
                    </Typography>
                  }
                  sx={{ cursor: 'pointer' }}
                  onClick={() => {
                    onSelectSession(session.id);
                    onClose();
                  }}
                />
                <ListItemSecondaryAction>
                  <IconButton 
                    edge="end" 
                    onClick={(e) => {
                      e.stopPropagation();  // Prevent triggering the ListItem click
                      onDeleteSession(session.id);
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
              <Divider />
            </React.Fragment>
          ))}
        </List>
      </DialogContent>
    </Dialog>
  );
};

export default SessionManager; 