import subprocess
import pathlib
import nysol.mcmd as nm
import io
dat=[
["customer","date","amount"],
["A","20180101",5200],
["B","20180101",800],
["B","20180112",3500],
["A","20180105",2000],
["B","20180107",4000]
]

def bigAmount(lowerBound):
    # header = True

    # for line in sys.stdin:
    #     if header:
    #         print(line.strip())
    #         header = False
    #     else:
    #         tokens = line.strip().split(",")
    #         if int(tokens[1])>=lowerBound:
    #             print(",".join(tokens))
    #
    stdin = sys.stdin
    for line in stdin:
        print(line.strip())
    # args = ['mselnul', 'f=amount','c=[4000,]']
    # args = ['mchkcsv', 'a=']
    # popen = subprocess.Popen(args, stdin=stdin, universal_newlines=True)
    # print(popen.stdout.read())

# def stdout_func(args):
#     stdin = open('kskp/data/frames/2C72275F-2019-49AE-B36D-A29D1507F8DD.csv', 'r')
#     popen = subprocess.Popen(args, stdin=stdin, stdout=subprocess.PIPE, universal_newlines=True)
#     stdout = popen.stdout
#     return stdout

def main():
    # f = None
    param = {'f':'0,1,2,3,4', 'x':True, 'o':'kskp/data/frames/result.csv'}
    # args = ['mchkcsv', 'a=']
    # stdout = stdout_func(args)
    # output = stdout.read()
    # nm.mstdin().run()
    # nm.mcut(param).run()
    # f=None

    #
    # nm.runfunc(bigAmount,lowerBound=4000).mcut(param).run()
    # sel=None
    # sel <<= nm.mcut(f="customer,amount",i=dat)
    # sel <<= nm.runfunc(bigAmount,lowerBound=4000)
    # sel <<= nm.msum(k="customer",f="amount")
    # nm.mcut(f="customer,amount",i=dat).runfunc(bigAmount,lowerBound=4000)
    # f=nm.mcut(f="customer,date,amount",i=dat).getline(header=True)
    # import sys
    # s = None
    # sys.stdout = s
    # f=nm.mcut(f="customer,date,amount",i=dat).run()
    # str = ''
    # for line in f:
    #     str += ','.join(line) + '\n'
    #     print(str)
    # i = io.StringIO()
    # i.write(str)
    # print(s)

    # args = ['mchkcsv', 'i=kskp/data/frames/2C72275F-2019-49AE-B36D-A29D1507F8DD.csv']
    f = None
    f <<= nm.cmd('mchkcsv a= i=kskp/data/frames/2C72275F-2019-49AE-B36D-A29D1507F8DD.csv')
    param.update({'i':f})
    nm.mcut(param).run()
    # #
    # popen = subprocess.Popen(args, stdin=sys.stdout, stdout=subprocess.PIPE, universal_newlines=True)
    # stdout = popen.stdout

if __name__ == '__main__':
    main()
