

import argparse
import json
import os
from pathlib import Path # python 3.4以上

def fetch_json_by_path(path):
    """
    指定したファイルの内容を返す
    """
    return json.loads(path.read_text())

def get_filePath_by_name(fileName, path, extension='.json'):
    """
    指定したファイル名をもつファイルのパスを返すヘルパー
    """
    for file_path in Path(path).iterdir():
        if not file_path.suffix == extension:
            continue
        if file_path.stem == fileName:
            return file_path

def write_data_to_json(path, data):
    """
    データをJSONとしてファイルに書き込むヘルパー
    """
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')

CONST_PORTS='ports'
def isExistInPorts(ports):
  return len(ports[0]) > 0

def isExistOutPorts(ports):
  return len(ports[1]) > 0

def getInPorts(ports):
  return ports[0]

def getOutPorts(ports):
  return ports[1]

PORT_STRUCTURE_BEFORE_ISSUE_147 = {
  "name": "対応するデータノードのid",
  "type": "frame"
}
PORT_STRUCTURE_AFTER_ISSUE_147 = {
  "label": "(任意のポート名)",
  "nodeId": "対応するデータノードのid",
  "type": "frame"
}
PORT_STRUCTURE_MAP_ISSUE_147 = {
  "labe" : "name",
  "nodeId" : "name",
  "type" : "type"
}

# 入力されたinOrOutPortsのStructureが同じ場合Trueを返す
def isSameStructure(ports, structure):
  result = True
  for port in ports:
    for key in structure:
      result = key in port
      if result == False:
        return result

  return result

# portの構造を変更する
# ports : Ports(=Dict Array)
# mapper : StructureMap(=Dict) 
def toPorts(ports, mapper):
  newPorts = []
  for port in ports:
    newPort = {}
    for newKey in mapper:
      oldKey = mapper[newKey]
      if oldKey in port:
        newPort[newKey] = port[oldKey]
    newPorts.append(newPort)    

  return newPorts

def getCommandArgs():
  # パーサーを作る
  parser = argparse.ArgumentParser(
              prog='toNewPorts.py', # プログラム名
              usage='python toNewPorts.py -f flowName', # プログラムの利用方法
              description='同じ場所にあるFlow.json（古い仕様）で', # 引数のヘルプの前に表示
              epilog='end', # 引数のヘルプの後で表示
              add_help=True, # -h/–help オプションの追加
            )
  parser.add_argument('-f', '--flow',
                   help='flowのuuid',
                   action='store',
                   required=True,
                   nargs=1
                  )
  return parser.parse_args()

MAPPER_NAME="PortsMapping"
def main():

  args = getCommandArgs()

  if not (args.flow and args.flow[0]):
    print("[WARN] flow_uuid is required")
    print("usage : python toNewPorts.py -f flow_uuid ")
    return

  flow_uuid = args.flow[0]
  targetPath = os.getcwd() # 該当UUIDのFlowを探す場所（作業ディレクトリ）
  mapTargetPath = os.getcwd() # PortsMapping.jsonを探す場所（作業ディレクトリ）
  flowPath = get_filePath_by_name(flow_uuid, targetPath) # 該当Flowの場所
  
  if not flowPath:
    print("[WARN] CANNOT FIND " + flow_uuid)
    print("in path : " + targetPath)
    return

  print("[INFO] Flow Searched")
  print(" " + str(flowPath))
  flow = fetch_json_by_path(flowPath)
  ports = flow[CONST_PORTS]
  # Mapping Fileを探す
  mapperPath = get_filePath_by_name(MAPPER_NAME, mapTargetPath)
  
  if not mapperPath:
    print("[WARN] CANNOT FIND ")
    print(" " + str(MAPPER_NAME))
    print("in path : " + str(mapTargetPath))
    return

  print("[INFO] Mapper Searched ")
  print(" " + str(mapperPath))
  mapper = fetch_json_by_path(mapperPath)
  beforeStructure = mapper["structure"]["before"]
  afterStructure = mapper["structure"]["after"]
  mapper = mapper["map"]
  
  # Port確認
  if (not isExistInPorts(ports)) and (not isExistOutPorts(ports)):
    print("[INFO] InOutPort does not exist( length = 0)")
    return

  isChanged = False
  # InPort確認
  if isExistInPorts(ports) and (isSameStructure(getInPorts(ports), afterStructure) == False):
    flow[CONST_PORTS][0] = toPorts(getInPorts(ports), mapper)
    print("[INFO] InPort is changed")
    isChanged = True
  else:
    print("[INFO] InPort is not changed")

  # OutPort確認
  if isExistOutPorts(ports) and (isSameStructure(getOutPorts(ports), afterStructure) == False):
    flow[CONST_PORTS][1] = toPorts(getOutPorts(ports), mapper)
    print("[INFO] OutPort is changed")
    isChanged = True
  else:
    print("[INFO] OutPort is not changed")

  if isChanged :
    print("[OUTPUT] " + str(flowPath))
    write_data_to_json(flowPath, flow)

main()