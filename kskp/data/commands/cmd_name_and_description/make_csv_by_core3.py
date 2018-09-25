import sys, os
import csv
import inspect
from pathlib import Path
from importlib import machinery
import core3


def make_csv():
    data = pick_description()

    with open("output.csv", 'w') as file:


        writer = csv.writer(file, lineterminator='\n')
        writer.writerow(data)


def strcls(class_name):
    return globals()[class_name]

def pick_description():
    # for str in inspect.getmembers()
    for f in core3.commands.keys():
        m = machinery.SourceFileLoader(f, 'core3.py')
        # from core3 import f
        print(m)
        module = m.load.module()
        print(module)


pick_description()