from django.core.management.base import BaseCommand
from serial_reader.serial_service import start_serial_reader, stop_serial_reader
import time
import signal
import sys

class Command(BaseCommand):
    help = 'Start Arduino serial reader service'
    
    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting serial reader...'))
        
        def signal_handler(sig, frame):
            self.stdout.write(self.style.WARNING('\nStopping serial reader...'))
            stop_serial_reader()
            sys.exit(0)
        
        signal.signal(signal.SIGINT, signal_handler)
        start_serial_reader()
        
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            signal_handler(None, None)