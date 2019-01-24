#!/bin/bash -eu
readonly  PROGNAME=$(basename $0 .sh)   # フォルダ名、拡張子を除いたファイル名
readonly  VERSION="0.0"

#外部モジュール参照
# MCMD使用

# 注意・残件
#   ・引数のチェック処理が不十分   必須、組み合わせ、簡単な内容チェックなどは未実装
#   ・空白含む項目名ある場合の挙動、未検証 ※恐らく意図通りにならない
#   ・NYSOLの集計系のMCMDが生成する キー項目の末尾へ接尾辞 %数字 を消すことができていない → MCMDでは支障ないが、KCMDやユーザ関数などで支障ありそう
#--------------------------------------------------------------
# groupby
#--------------------------------------------------------------
# NYSOL版 Group by 相当処理   横型データの作成方針
# 引数として与えらた変数
#    k=              集計キー項目をカンマ区切りで与える
#                    変数：key_list
#    sensor_list=    同じ統計量計算を行う対象とする列範囲の指定  形式  入力データの列名をカンマ区切りで与える
#    feature_list=   NYSOLの統計量の指定と算出結果の列名の指定  形式  演算の指定:作成列名 をカンマ区切りで与える
#    [i=]            入力ファイル名を指定する。省略時は、標準入力を処理する
#                    変数：input_file      入力ファイル名
#    [o=]            出力ファイル名を指定する。省略時は、標準出力へ書き込む
#    [-no_sort]      指定した場合、集計キー項目でソートをしない
#                    注意：予めソート
#    [-nkfo]         集計キー項目を列に分けて出力する代わりに、一つの列に種受けキーの値を空白区切りで連結した列を出力する場合に指定
#                    No Key Fields for Output
#                    変数：key_columns    集計キー項目列を出力するか否か
#                     ON   集計キー列を出力
#                     OFF  集計キー列を出力せす、集計キーを連結した 列名連結と値連結 した列を出力する
#    [-nfno]         項目名行を出力しない場合に指定する
#                    No Field Names for Output
#                    変数：header_output   ヘッダー行の出力要否   コマンド引数 -nfno より値をセットする
#                     ON   ヘッダー行を出力
#                     OFF  ヘッダー行を出力しない
#    [field_name_delimiter=]  センサー名と特徴量名との区切り文字。 省略時は _
#    [-field_name_prefix]     センサー名と特徴量名との連結方法を、接頭辞型にする。 省略時は、接尾型
#
# 処理の流れ
#   msortf      集計キー項目でソート
#   msummary    出力：複数項目を対象とした場合、統計量列は、横型
#   <Option>    横型の列項目の演算による列追加したい場合は、ここに記述する
#   m2cross     出力：統計量列を、縦型へ変換  ※全ての統計量を縦型データにする
#   mcal        出力：全ての統計量を識別する名前を値とする列を追加
#   mcross      出力：縦型の全ての統計量を、mcalで作成した列名で、列方向へ展開
#   mcut        mcrosが自動作成する不要なfld列を除外
#--------------------------------------------------------------
function usage() {
    echo "${PROGNAME} ： グループ別統計量算出"
    echo "==========="
    echo "  NYSOL MCMDを用いて、複数項目による集計において、"
    echo "  複数の数値列に対して、複数の統計量を適用した結果を、数値列名と統計量名からなる列名として出力する。"
    echo
    echo "  k= カンマ区切りで与えた列名リストを、集計の項目列とし、"
    echo "  sensor_list=  カンマ区切りで与えた列名リストを、集計対象とする数値項目列とし、"
    echo "  feature_list= カンマ区切りで与えた集計で適用する統計量と結果に付加する接辞の指定より、"
    echo "  集計項目列でユニーク化したレコードに、数値項目列 × 統計量 の全ての組合せの演算結果を列とした結果を出力する。"
    echo
    echo "  演算子は、NYSOL 統計量リスト を指定することが可能"
    echo
    echo "書式"
    echo "------"
    echo "${PROGNAME} k=  sensor_list=  feature_list= [i=] [o=] [-no_sort] [-nkfo] [-nfno]"
    echo " [field_name_delimiter=] [-field_name_prefix]"
    echo " [-assert_diffSize] [-assert_nullkey] [-assert_nullin] [-assert_nullout]"
    echo " [tmpPath=] [precision=] [--help] [--version]"
    echo
    echo "例"
    echo "${PROGNAME} k=KA,KB sensor_list=A,B feature_list=count:Num,mean:Avg"
    echo "出力の列名  KA%0,KB%1,A_Avg,A_Num,B_Avg,B_Num"

    exit 1
}

#bash pcmd/groupby.sh i=output/d_log.csv k=DATA_SOURCE,状態 sensor_list=3H,3V,4H,4V feature_list=count:Num,max:Max
# stdin
#cat output/d_log.csv | bash pcmd/groupby.sh k=DATA_SOURCE,状態 sensor_list=3H,3V,4H,4V feature_list=count:Num,max:Max field_name_delimiter='|' -field_name_prefix


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
no_sort=""
input_file=""
output_file=""
key_list=""
sensor_name=""
sensor_list=""
feature_list=""
feature_list_2=""
tmp_path=""
assert_diffSize=""
assert_nullkey=""
assert_nullin=""
assert_nullout=""
precision=""
field_name_delimiter="_"
field_name_prefix=false


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
        '-no_sort' )
            no_sort="ON"
            param+=( "$@" )
            shift 1
            ;;
        '-nkfo' )
            key_columns="OFF"
            param+=( "$@" )
            shift 1
            ;;
        '-nfno' )
            header_output="OFF"
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
            field_name_prefix=true
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

# feature_list_2  feature_listの指定によりmsummaryで作成された列名をカンマ区切りで与えたリスト
feature_list_2=""
top_flg=1
for k in ${feature_list//,/ }; do
  if [ ${top_flg} = 1 ]; then
    feature_list_2="${k#*:}"
    top_flg=0
  else
    feature_list_2="${feature_list_2},${k#*:}"
  fi
done

readonly SENSOR_NAME='_sensor_name_'          # 同じ統計量計算を行う対象とする列範囲の指定で、それらを意味する概念的な項目名 ※テンポラリで最終出力には含まれない
readonly VAR_NAME='_var_name_'                # 全て縦型に変換する時の 統計量の名前を保持する列名を意味 ※テンポラリで最終出力には含まれない
readonly VALUE_NAME='_value_name_'            #     〃              統計量の値を保持する列名を意味  ※テンポラリで最終出力には含まれない
readonly UNIQUE_VAR_NAME='_unique_var_name_'  # group byで集計された列名 を保持するための列名を意味  ※テンポラリで最終出力には含まれない
readonly KEY_VALUE_LIST='KEY_VALUE_LIST'      # 集計キーの値を     空白区切りのベクトルで出力する 列名
readonly KEY_NAME_LIST='KEY_NAME_LIST'        # 集計キーの項目名を          〃
readonly key_name_char='"'${key_list//,/\",\"}'"'      # a,b,c 形式から "a","b","c" 形式へ変換   補足：mcal cat() で使用
readonly key_value_char='$s{'${key_list//,/'},$s{'}'}' # a,b,c 形式から $s{a},$s{b},$s{c} 形式へ変換   補足：mcal cat() で使用

# i= 指定が無い場合、標準入力をセットする
if [[ -z ${input_file} ]]; then
  input_file='/dev/stdin'
fi

# o= 指定が無い場合、標準出力をセットする
if [[ -z ${output_file} ]]; then
  output_file='/dev/stdout'
fi

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


# センサー名、特徴量名、区切り文字からの列名作成指示
sensor_feature_name=""
if [[ "${field_name_prefix}" = true ]]; then
  sensor_feature_name='cat("'${field_name_delimiter}'",$s{'${VAR_NAME}'},$s{'${SENSOR_NAME}'})'
else
  sensor_feature_name='cat("'${field_name_delimiter}'",$s{'${SENSOR_NAME}'},$s{'${VAR_NAME}'})'
fi

if [[ -z ${no_sort} ]]; then
  msortf   f=${key_list} ${tmp_path} ${assert_diffSize} \
           < ${input_file} |
  msummary k=${key_list} \
           f=${sensor_list} \
           c=${feature_list}  \
           a=${SENSOR_NAME} ${tmp_path} ${assert_nullkey} ${assert_nullin} ${assert_nullout} ${precision} |
              m2cross  k=${key_list},${SENSOR_NAME} \
                       f=${feature_list_2} \
                       a=${VAR_NAME},${VALUE_NAME} ${tmp_path} ${assert_nullkey} ${assert_nullin} ${assert_nullout} |
              mcal     a=${UNIQUE_VAR_NAME} \
                       c=${sensor_feature_name} ${assert_diffSize} ${tmp_path} ${assert_nullkey} ${assert_nullin} ${assert_nullout} ${precision} |
              mcross   k=${key_list} \
                       f=${VALUE_NAME} \
                       s=${UNIQUE_VAR_NAME} ${tmp_path} ${assert_nullkey} ${assert_nullin} ${assert_nullout} |
              if [ ${key_columns} == "OFF" ]; then
                mcal     a=${KEY_NAME_LIST} \
                         c='cat(" ",'${key_name_char}')' ${assert_diffSize} ${tmp_path} ${assert_nullkey} ${assert_nullin} ${assert_nullout} ${precision} |
                mcal     a=${KEY_VALUE_LIST} \
                         c=${sensor_feature_name} ${assert_diffSize} ${tmp_path} ${assert_nullkey} ${assert_nullin} ${assert_nullout} ${precision} |
                mcut     f=${key_list},fld -r ${header} ${tmp_path} ${assert_diffSize} \
                         > ${output_file}
              else
                mcut     f=fld -r ${header} ${tmp_path} ${assert_diffSize} \
                         > ${output_file}
              fi
else
  msummary k=${key_list} \
           f=${sensor_list} \
           c=${feature_list}  \
           a=${SENSOR_NAME} ${tmp_path} ${assert_nullkey} ${precision} \
           < ${input_file} |
               m2cross  k=${key_list},${SENSOR_NAME} \
                        f=${feature_list_2} \
                        a=${VAR_NAME},${VALUE_NAME} ${tmp_path} ${assert_nullkey} ${assert_nullin} ${assert_nullout} |
               mcal     a=${UNIQUE_VAR_NAME} \
                        c=${sensor_feature_name}  ${assert_diffSize} ${tmp_path} ${assert_nullkey} ${assert_nullin} ${assert_nullout} ${precision} |
               mcross   k=${key_list} \
                        f=${VALUE_NAME} \
                        s=${UNIQUE_VAR_NAME} ${tmp_path} ${assert_nullkey} ${assert_nullin} ${assert_nullout} |
               if [ ${key_columns} == "OFF" ]; then
                 mcal     a=${KEY_NAME_LIST} \
                          c='cat(" ",'${key_name_char}')' ${assert_diffSize} ${tmp_path} ${assert_nullkey} ${assert_nullin} ${assert_nullout} ${precision} |
                 mcal     a=${KEY_VALUE_LIST} \
                          c='cat(" ",'${key_value_char}')' ${assert_diffSize} ${tmp_path} ${assert_nullkey} ${assert_nullin} ${assert_nullout} ${precision} |
                 mcut     f=${key_list},fld -r ${header} ${tmp_path} ${assert_diffSize} \
                          > ${output_file}
               else
                 mcut     f=fld -r ${header} ${tmp_path} ${assert_diffSize} \
                          > ${output_file}
               fi
fi

exit 0
