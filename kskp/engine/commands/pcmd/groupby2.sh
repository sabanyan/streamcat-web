#!/bin/bash -eu
readonly  PROGNAME=$(basename $0 .sh)   # フォルダ名、拡張子を除いたファイル名
readonly  VERSION="0.0"

#外部モジュール参照
# MCMD使用
# PCMD(仮称)使用 groupby.sh

readonly  SCRIPT_DIR=$(cd $(dirname $0); pwd) #このスクリプトの絶対パス
readonly  GROUPBY_COMMAND="bash ${SCRIPT_DIR}/groupby.sh"



#bash pcmd/groupby2.sh k=DATA_SOURCE,状態 sensor_list=3H,3V,4H,4V feature_list=count:Num,max:Max i=output/d_log.csv tag_axis_name=時分割 tag_axis_value=時分割_値 tag_field_list=時分割1秒,時分割0.5秒

# 注意・残件
#   ・引数のチェック処理が不十分   必須、組み合わせ、簡単な内容チェックなどは未実装
#   ・空白含む項目名ある場合の挙動、未検証 ※恐らく意図通りにならない
#   ・NYSOLの集計系のMCMDが生成する キー項目の末尾へ接尾辞 %数字 を消すことができていない → MCMDでは支障ないが、KCMDやユーザ関数などで支障ありそう
#--------------------------------------------------------------
# groupby2
#--------------------------------------------------------------
# NYSOL版 Group by 相当処理   横型データの作成方針
# 引数として与えらた変数
#    k=              集計キー項目をカンマ区切りで与える
#                    変数：key_list
#    sensor_list=    同じ統計量計算を行う対象とする列範囲の指定  形式  入力データの列名をカンマ区切りで与える
#    feature_list=   NYSOLの統計量の指定と算出結果の列名の指定  形式  演算の指定:作成列名 をカンマ区切りで与える
#
#    [tag_field_list=]  変動部分の集計キー項目をカンマ区切りで与える 対象が無い場合は””で与える#
#    [tag_axis_name=]   変動部分の集計キー項目群に対する概念的な項目名  ※この列名を集計キーの一つとして出力する
#    [tag_axis_value=]  変動部分の集計キー項目の値を保持する項目名     ※この列名を集計キーの一つとして出力する
#
#    [field_name_delimiter=]  センサー名と特徴量名との区切り文字。 省略時は _
#    [-field_name_prefix]     センサー名と特徴量名との連結方法を、接頭辞型にする。 省略時は、接尾型
#
#    i=              入力ファイル名を指定する。 標準入力は不可
#                    変数：input_file      入力ファイル名
#    [o=]            出力ファイル名を指定する。省略時は、標準出力へ書き込む
# 処理の流れ
#
#
#
#--------------------------------------------------------------
function usage() {
    echo "${PROGNAME} ： タグ型グループ別統計量算出"
    echo "==========="
    echo "  NYSOL MCMDを用いて、複数項目による集計において、"
    echo "  複数の数値列に対して、複数の統計量を適用した結果を、数値列名と統計量名からなる列名として出力するが、"
    echo "  タグ型の複数の列項目も集計のキーとして追加の指定が可能。"
    echo
    echo "  k= カンマ区切りで与えた列名リストを、集計の項目列とし、"
    echo "  tag_field_list= カンマ区切りで与えたタグ型の列名リストを、1つの集計の項目と扱い"
    echo "  k= 指定の項目と、tag_field_list= 指定で2つできる項目(項目名は tag_axis_name= tag_axis_value= で与える)"
    echo "  を集計のキー項目とし、"
    echo "  sensor_list=  カンマ区切りで与えた列名リストを、集計対象とする数値項目列とし、"
    echo "  feature_list= カンマ区切りで与えた集計で適用する統計量と結果に付加する接辞の指定より、"
    echo "  集計項目列でユニーク化したレコードに、数値項目列 × 統計量 の全ての組合せの演算結果を列とした結果を出力する。"
    echo
    echo "  演算子は、NYSOL 統計量リスト を指定することが可能"
    echo
    echo "書式"
    echo "------"
    echo "${PROGNAME} k=  sensor_list=  feature_list=  i= [o=] "
    echo " [tag_field_list=] [tag_axis_name=] [tag_axis_value=]"
    echo " [-assert_diffSize] [-assert_nullkey] [-assert_nullin] [-assert_nullout]"
    echo " [tmpPath=] [precision=] [--help] [--version]"
    echo
    echo "例"
    echo "${PROGNAME} k=KA,KB sensor_list=A,B feature_list=count:Num,mean:Avg  i=d.csv"
    echo "  tag_field_list=T1,T2 tag_axis_name=CASE  tag_axis_value=CASE_VALUE"
    echo ""
    echo "出力の列名  KA%0,KB%1,CASE_VALUE%2,A_Avg,A_Num,B_Avg,B_Num,CASE"

    exit 1
}

# エラー処理
set -e -u -o pipefail   # パイプ処理中にエラー発生で処理を終了する設定
error(){
  echo "#ERROR# Stoped ${PROGNAME}"
  echo "[ ${BASH_SOURCE} : ${LINENO} ] returns not zero status"
  exit 1
}
trap error ERR

# 引数の格納用変数、デフォルト値のセット
key_columns="ON"
header_output="ON"
input_file=""
output_file=""
key_list=""
sensor_name=""
sensor_list=""
feature_list=""
tmp_path=""
assert_diffSize=""
assert_nullkey=""
assert_nullin=""
assert_nullout=""
precision=""
tag_field_list=""
tag_axis_name=""
tag_axis_value=""
field_name_delimiter="_"
field_name_prefix=""


param=""
for OPT in "$@"
do
#  echo $OPT
    case "$OPT" in
        '-h'|'--help' )
            usage
            exit 1
            ;;
        '--version' )
            echo ${VERSION}
            exit 1
            ;;
        '-assert_nullkey' )
            assert_nullkey="-assert_nullkey"
            shift 1
            ;;
        '-assert_nullin' )
            assert_nullin="-assert_nullin"
            shift 1
            ;;
        '-assert_nullout' )
            assert_nullout="-assert_nullout"
            shift 1
            ;;
        '-assert_diffSize' )
            assert_diffSize="-assert_diffSize"
            shift 1
            ;;
        'tmpPath='* )
            p_value=${1#*'='}                 # =より前の文字を削除
            if [[ -z "${p_value}" ]] ; then   # -z: 文字列長がゼロ
                echo "${PROGNAME}: option requires an argument -- $1" 1>&2
                exit 1
            fi
            tmp_path=${p_value}
            shift 1
            ;;
        'precision='* )
            p_value=${1#*'='}                 # =より前の文字を削除
            if [[ -z "${p_value}" ]] ; then   # -z: 文字列長がゼロ
                echo "${PROGNAME}: option requires an argument -- $1" 1>&2
                exit 1
            fi
            precision=${p_value}
            shift 1
            ;;
        'i='* )
            p_value=${1#*'='}                 # =より前の文字を削除
            if [[ -z "${p_value}" ]] ; then   # -z: 文字列長がゼロ
                echo "${PROGNAME}: option requires an argument -- $1" 1>&2
                exit 1
            fi
            input_file=${p_value}
            param+=( "$@" )
            shift 1
            ;;
        'o='* )
            p_value=${1#*'='}                 # =より前の文字を削除
            if [[ -z "${p_value}" ]] ; then   # -z: 文字列長がゼロ
                echo "${PROGNAME}: option requires an argument -- $1" 1>&2
                exit 1
            fi
            output_file=${p_value}
            param+=( "$@" )
            shift 1
            ;;
        'k='* )
            p_value=${1#*'='}                 # =より前の文字を削除
            if [[ -z "${p_value}" ]] ; then   # -z: 文字列長がゼロ
                echo "${PROGNAME}: option requires an argument -- $1" 1>&2
                exit 1
            fi
            key_list=${p_value}
            param+=( "$@" )
            shift 1
            ;;
        'sensor_list='* )
            p_value=${1#*'='}                 # =より前の文字を削除
            if [[ -z "${p_value}" ]] ; then   # -z: 文字列長がゼロ
                echo "${PROGNAME}: option requires an argument -- $1" 1>&2
                exit 1
            fi
            sensor_list=${p_value}
            param+=( "$@" )
            shift 1
            ;;
        'feature_list='* )
            p_value=${1#*'='}                 # =より前の文字を削除
            if [[ -z "${p_value}" ]] ; then   # -z: 文字列長がゼロ
                echo "${PROGNAME}: option requires an argument -- $1" 1>&2
                exit 1
            fi
            feature_list=${p_value}
            param+=( "$@" )
            shift 1
            ;;
        'tag_field_list='* )
            p_value=${1#*'='}                 # =より前の文字を削除
            if [[ -z "${p_value}" ]] ; then   # -z: 文字列長がゼロ
                echo "${PROGNAME}: option requires an argument -- $1" 1>&2
                exit 1
            fi
            tag_field_list=${p_value}
            param+=( "$@" )
            shift 1
            ;;
        'tag_axis_name='* )
            p_value=${1#*'='}                 # =より前の文字を削除
            if [[ -z "${p_value}" ]] ; then   # -z: 文字列長がゼロ
                echo "${PROGNAME}: option requires an argument -- $1" 1>&2
                exit 1
            fi
            tag_axis_name=${p_value}
            param+=( "$@" )
            shift 1
            ;;
        'tag_axis_value='* )
            p_value=${1#*'='}                 # =より前の文字を削除
            if [[ -z "${p_value}" ]] ; then   # -z: 文字列長がゼロ
                echo "${PROGNAME}: option requires an argument -- $1" 1>&2
                exit 1
            fi
            tag_axis_value=${p_value}
            param+=( "$@" )
            shift 1
            ;;
        'field_name_delimiter='* )
            p_value=${1#*'='}                 # =より前の文字を削除
            if [[ -z "${p_value}" ]] ; then   # -z: 文字列長がゼロ
                echo "${PROGNAME}: option requires an argument -- $1" 1>&2
                exit 1
            fi
            field_name_delimiter=${p_value}
            shift 1
            ;;
        '-field_name_prefix' )
            field_name_prefix="-field_name_prefix"
            param+=( "$@" )
            shift 1
            ;;
        '--'|'-' )
            shift 1
            param+=( "$@" )
            break
            ;;
        *)
            echo "$PROGNAME: illegal option -- '$(echo $1 | sed 's/^-*//')'" 1>&2
            exit 1
            ;;
    esac
done

#if [[ -z $param ]]; then
#    echo "$PROGNAME: too few arguments" 1>&2
#    echo "Try '$PROGNAME --help' for more information." 1>&2
#    exit 1
#fi

#必須パラメータの指定


# ヘッダー行出力の指定
header=""
if [ ${header_output} == "OFF" ]; then
  header="-nfno"
else
  header=""
fi

# tmpPath=
if [[ -n ${tmp_path} ]]; then
  tmp_path='tmpPath='${tmp_path}
fi

# precision=
if [[ -n ${precision} ]]; then
  precision='precision='${precision}
fi

if [[ -n ${output_file} ]]; then
  rm -f ${output_file}
fi

# field_name_delimiter=
if [[ -n ${field_name_delimiter} ]]; then
  field_name_delimiter='field_name_delimiter='${field_name_delimiter}
fi



first=true
header_output=""            # この関数の出力で、先頭のみにヘッダー行を出力するための制御
option_list="${assert_diffSize} ${assert_nullkey} ${assert_nullin} ${assert_nullout} ${tmp_path} ${precision}"

for k in ${tag_field_list//,/ }; do
  keys=${key_list},${k}     # 集計のキー項目
  ${GROUPBY_COMMAND} \
          k=${keys} \
          sensor_list=${sensor_list} \
          feature_list=${feature_list} \
          i=${input_file} ${option_list} ${field_name_delimiter} ${field_name_prefix} |
  mfldname f=${k}:${tag_axis_value} |
  if [[ -n ${output_file} ]]; then
    msetstr v=${k} \
            a=${tag_axis_name} \
            ${header_output} ${assert_diffSize} ${tmp_path} \
            >> ${output_file}
  else
    msetstr v=${k} \
            a=${tag_axis_name} \
            ${header_output} ${assert_diffSize} ${tmp_path}
  fi

  if [[ "${first}" = true ]]; then
    first=false
    header_output="-nfno"
  fi
done

exit 0
