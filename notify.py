import smtplib
from plyer import notification
import time
from notifyproject import name_, time_value

EMAIL_ADDRESS = 'anwarbasha1506@gmail.com'
EMAIL_PASSWORD = 'gbodqlbxmugonkha'  # Your app password
RECEIVER_MAIL = name_

def notifyme(title, message):
    notification.notify(
        title=title,
        message=message,
        app_icon="S:\\project_Time\\Time_based_Break_app\\icon_alert.ico",  # Fixed path
        timeout=10,
    )

if __name__ == '__main__':
    notifyme("Alert!!!!", "Your PC is in parental control")
    
    while True:
        time.sleep(int(time_value))
        hours = int(time_value) // 3600
        minutes = (int(time_value) % 3600) // 60
        seconds = int(time_value) % 60
        
        message = f"It's been {hours} hours, {minutes} minutes, and {seconds} seconds. You should take a break!"
        print(message)  # Added for debugging
        
        notifyme("Alert!!!!", message)
        
        try:
            # Sending the email
            server = smtplib.SMTP('smtp.gmail.com', 587)
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
            
            subject = "PC Usage of Your Son"
            body = "Your child has been using the laptop continuously. Ask him to take a break."
            message = f'Subject: {subject}\n\n{body}'
            
            server.sendmail(EMAIL_ADDRESS, RECEIVER_MAIL, message)
            server.quit()
            print("Email sent successfully.")
        except Exception as e:
            print(f"Error sending email: {e}")
