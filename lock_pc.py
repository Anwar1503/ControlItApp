import ctypes

n=int(input("Enter 1 to lock your pc: "))

if(n==1):
    ctypes.windll.user32.LockWorkStation()
