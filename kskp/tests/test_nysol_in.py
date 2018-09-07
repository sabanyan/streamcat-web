import subprocess
import pathlib
import nysol.mcmd as nm

dat=[
["customer","date","amount"],
["A","20180101",5200],
["B","20180101",800],
["B","20180112",3500],
["A","20180105",2000],
["B","20180107",4000]
]

def bigAmount(lowerBound):
  f = None
  f <<= nm.mstdin()
  f <<= nm.mselnum(f="amount",c="[lowerBound,]")
  f <<= nm.mstdout()
  f.run()

def main():
    # stdin = open('kskp/data/frames/2C72275F-2019-49AE-B36D-A29D1507F8DD.csv', 'r')
    # stdout = open('kskp/data/frames/result.csv', 'w')
    # args = ['mchkcsv', 'a=']
    # popen = subprocess.Popen(args, stdin=stdin, stdout=subprocess.PIPE, universal_newlines=True)

    # f=None
    # param = {'f':'0,1,2,3,4', 'x':True, 'o':'kskp/data/frames/result.csv'}
    # # param2 = {'s': '3H', 'from': '0', 'to': '3', 'size': '', 'k': '', 'i': 'kskp/data/frames/a06659f2-abfa-4968-809a-65a92b5df057.csv', 'o': 'kskp/data/frames/cefb6603-8c70-43f9-87a9-6ece16677e2f.csv'}
    # # nm.mbest(param2).run()
    #
    # # nm.cmd("mchkcsv i=kskp/data/frames/2C72275F-2019-49AE-B36D-A29D1507F8DD.csv").mcut(param).run()
    # nm.runfunc(bigAmount,lowerBound=4000).mcut(param).run()
    sel=None
    sel <<= nm.mcut(f="customer,amount",i=dat)
    sel <<= nm.runfunc(bigAmount,lowerBound=4000)
    sel <<= nm.msum(k="customer",f="amount")
    nm.mcut(f="customer,amount",i=dat).runfunc(bigAmount,lowerBound=4000)
    print(sel.run())

if __name__ == '__main__':
    main()
