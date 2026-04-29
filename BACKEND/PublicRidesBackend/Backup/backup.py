import os
import datetime
import json
import subprocess
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from dotenv import dotenv_values

config = dotenv_values(".env")
now = datetime.datetime.now()
timestamp = now.strftime("%Y-%m-%d_%H-%M-%S")

def sendEmail(subject, body):
    msg = MIMEMultipart()
    msg['From'] = config['EMAIL_FROM']
    msg['To'] = config['EMAIL_TO']
    msg['Cc'] = ', '.join(config['EMAIL_CC'])
    msg['Subject'] = subject

    msg.attach(MIMEText(body, 'plain'))
    recipients = [config['EMAIL_TO']] + json.loads(config['EMAIL_CC'])

    try:
        server = smtplib.SMTP(config['SMTP_SERVER'], config['SMTP_PORT'])
        server.starttls()
        server.login(config['EMAIL_FROM'], config['EMAIL_PASS'])
        server.sendmail(config['EMAIL_FROM'], recipients, msg.as_string())
        server.quit()
        print("✅ Email sent successfully.")
    except Exception as e:
        print("❌ Failed to send email:", e)

def backupMongodb():
    backupPath = os.path.join(config['BACKUP_DIR'], f"VMTracker_Mongodb_dump_{timestamp}")
    os.makedirs(backupPath, exist_ok=True)

    dumpCmd = f'"{config['MONGO_DUMP_PATH']}" --uri="{config['MONGO_URL']}" --out="{backupPath}"'
    result = subprocess.run(dumpCmd, shell=True, stderr=subprocess.PIPE)
    
    if result.returncode != 0:
        raise Exception(f"mongodump failed: {result.stderr.decode()}")

    return backupPath, os.path.basename(backupPath)

def backupPostgresql():
    filename = f"VMTracker_PG_dump_{timestamp}.sql"
    backupPath = os.path.join(config['BACKUP_DIR'], filename)
    
    env = os.environ.copy()
    env["PGPASSWORD"] = config['POSTGRES_PASSWORD']

    dumpCmd = [
        "pg_dumpall",
        "-U", config['POSTGRES_USER'],
        "-h", config['POSTGRES_HOST'],
        "-p", config['POSTGRES_PORT']
    ]
    
    with open(backupPath, 'w', encoding='utf-8') as outfile:
        result = subprocess.run(dumpCmd, stdout=outfile, stderr=subprocess.PIPE, env=env)
        
    if result.returncode != 0:
        raise Exception(f"pg_dumpall failed: {result.stderr.decode()}")
    
    return backupPath, filename

def remoteUpload(filePath):
    scpCmd = f"scp -P {config['REMOTE_PORT']} -r {filePath} {config['REMOTE_USER']}@{config['REMOTE_HOST']}:{config['REMOTE_DIR']}/"
    result = subprocess.run(scpCmd, shell=True, capture_output=True)
    if result.returncode != 0:
        raise Exception(f"SCP failed: {result.stderr.decode()}")

def cleanupOldBackups(directory, prefix, days=7):
    
    nowTs = now.timestamp()
    for file in os.listdir(directory):
        if file.startswith(prefix):
            filePath = os.path.join(directory, file)
            if os.path.isfile(filePath) or os.path.isdir(filePath):
                fileAge = nowTs - os.path.getmtime(filePath)
                if fileAge > days * 86400:
                    if os.path.isdir(filePath):
                        subprocess.run(f'rmdir /s /q "{filePath}"', shell=True)
                    else:
                        os.remove(filePath)

def remoteCleanup():
    sshCmd = f'ssh -p {config['REMOTE_PORT']} {config['REMOTE_USER']}@{config['REMOTE_HOST']} "find {config['REMOTE_DIR']} -name \"VMTracker_*\" -mtime +7 -delete"'
    subprocess.run(sshCmd, shell=True)

try:
    pgBackupPath, pgFilename = backupPostgresql()
    mongoBackupPath, mongoFilename = backupMongodb()

    remoteUpload(pgBackupPath)
    remoteUpload(mongoBackupPath)

    cleanupOldBackups(config['BACKUP_DIR'], "VMTracker_", 0)
    remoteCleanup()

    print("✅ Backup successful")
    sendEmail("✅ Backup Success", f"Backup completed at {timestamp}.\n\nFiles:\n{pgFilename}\n{mongoFilename}")

except Exception as e:
    sendEmail("❌ Backup Failed", f"Backup failed at {timestamp}.\nError: {str(e)}")
    print("FAILED")