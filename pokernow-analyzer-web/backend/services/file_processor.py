import csv
from datetime import datetime
from typing import Dict, Optional, List
import re

class FileProcessor:
    def __init__(self):
        self.hand_start_pattern = re.compile(r"-- starting hand #1")
        self.hand_end_pattern = re.compile(r"-- ending hand #\d+")

    def process_file(self, file_path: str) -> Dict:
        """Process a poker session CSV file and extract relevant information."""
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                # Skip header
                next(file)
                
                # Read all lines and reverse them
                lines = list(reversed(file.readlines()))
                
                start_time = None
                end_time = None
                
                # Find start time (first hand)
                for line in lines:
                    if self.hand_start_pattern.search(line):
                        start_time = self._extract_timestamp(line)
                        break
                
                # Find end time (last hand)
                for line in lines:
                    if self.hand_end_pattern.search(line):
                        end_time = self._extract_timestamp(line)
                        break
                
                if not start_time or not end_time:
                    raise ValueError("Could not find start or end time in file")

                return {
                    "start_time": start_time,
                    "end_time": end_time
                }

        except Exception as e:
            raise Exception(f"Error processing file: {str(e)}")

    def _extract_timestamp(self, line: str) -> datetime:
        """Extract timestamp from a line of the CSV file."""
        try:
            parts = line.strip().split(',')
            if len(parts) < 3:
                raise ValueError("Invalid line format")
            
            # Get timestamp between second-to-last and last comma
            timestamp_str = parts[-2].strip()
            
            # Handle 'Z' timezone indicator
            if timestamp_str.endswith('Z'):
                timestamp_str = timestamp_str[:-1] + '+00:00'
            
            return datetime.fromisoformat(timestamp_str)
        except Exception as e:
            raise ValueError(f"Error extracting timestamp: {str(e)}")

    def extract_file_id(self, filename: str) -> str:
        """Extract file ID from filename."""
        prefix = "poker_now_log_"
        if filename.startswith(prefix):
            # Remove prefix and any file extension
            return filename[len(prefix):].split('.')[0].split(' ')[0]  # Also remove any text in parentheses
        return filename.split('.')[0] 