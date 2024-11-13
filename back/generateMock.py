ini_data = [
    {"year": "2022", "height": 80, "weight": 120, "value": 20},
    {"year": "2023", "height": 180, "weight": 160, "value": 10},
    {"year": "2024", "height": 280, "weight": 220, "value": 60}
]
ini_config = [
    {
        "name": "BarRight",
        "meta": {
            "width": "40%",
            "height": "20%",
            "left": "15%",
            "top": "5%"
        },
        "x": "year",
        "y": "height",
        "interactionType": "filter",
        "interactionKey": "height",
        "allowedinteractionType": "filter"
    },
    {
        "name": "BarVertical",
        "meta": {
            "width": "20%",
            "height": "60%",
            "left": "15%",
            "top": "5%"
        },
        "x": "year",
        "y": "height",
        "interactionType": "filter",
        "interactionKey": "height",
        "allowedinteractionType": "filter"
    },
    {
        "name": "Donat",
        "meta": {
            "width": "30%",
            "height": "30%",
            "left": "25%",
            "top": "55%"
        },
        "x": "year",
        "y": "height",
        "interactionType": "filter",
        "interactionKey": "height",
        "allowedinteractionType": "filter"
    },
    {
        "name": "Line",
        "meta": {
            "width": "30%",
            "height": "30%",
            "left": "65%",
            "top": "15%"
        },
        "x": "year",
        "y": "height",
        "interactionType": "filter",
        "interactionKey": "height",
        "allowedinteractionType": "filter"
    },
    {
        "name": "Scatter",
        "meta": {
            "width": "30%",
            "height": "30%",
            "left": "15%",
            "top": "85%"
        },
        "x": "height",
        "y": "weight",
        "z": "value",
        "interactionType": "filter",
        "interactionKey": "height",
        "allowedinteractionType": "filter"
    }
]
config0=[
  {
        "name": "BarRight",
        "meta": {
            "width": "90%",
            "height": "40%",
            "left": "5%",
            "top": "5%"
        },
        "x": "year",
        "y": "height",
        "interactionType": "filter",
        "interactionKey": "height",
        "allowedinteractionType": "filter"
    },
  {
        "name": "Line",
        "meta": {
            "width": "40%",
            "height": "60%",
            "left": "5%",
            "top": "30%"
        },
        "x": "year",
        "y": "height",
        "interactionType": "filter",
        "interactionKey": "height",
        "allowedinteractionType": "filter"
    },{
        "name": "Scatter",
        "meta": {
            "width": "45%",
            "height": "60%",
            "left": "50%",
            "top": "30%"
        },
        "x": "height",
        "y": "weight",
        "z": "value",
        "interactionType": "filter",
        "interactionKey": "height",
        "allowedinteractionType": "filter"
    }
]
config1=[
  {
        "name": "Donat",
        "meta": {
            "width": "35%",
            "height": "35%",
            "left": "30%",
            "top": "5%"
        },
        "x": "year",
        "y": "height",
        "interactionType": "filter",
        "interactionKey": "height",
        "allowedinteractionType": "filter"
    },
  {
        "name": "Scatter",
        "meta": {
            "width": "60%",
            "height": "45%",
            "left": "30%",
            "top": "45%"
        },
        "x": "height",
        "y": "weight",
        "z": "value",
        "interactionType": "filter",
        "interactionKey": "height",
        "allowedinteractionType": "filter"
    },
  {
        "name": "BarVertical",
        "meta": {
            "width": "20%",
            "height": "90%",
            "left": "5%",
            "top": "5%"
        },
        "x": "year",
        "y": "height",
        "interactionType": "filter",
        "interactionKey": "height",
        "allowedinteractionType": "filter"
    },
]
config2=[
  {
        "name": "Scatter",
        "meta": {
            "width": "90%",
            "height": "90%",
            "left": "5%",
            "top": "5%"
        },
        "x": "height",
        "y": "weight",
        "z": "value",
        "interactionType": "filter",
        "interactionKey": "height",
        "allowedinteractionType": "filter"
    },
]
def generate_mock(round):
    if round == 1:
      return {
        'summary':'这是一个时间序列的数据',
        'result':config0,
        'recommendation':["我想看看重量数据","这个数据还有什么值得探索的"]
      }
    if round == 2:
      return {
        'summary':'我们来看一看高width和height的分布',
        'result':config1,
        'recommendation':["我想看看高度数据"]
      }
    if round == 3:
      return {
        'summary':'好的，我们来通过散点图总结width和height的分布',
        'result':config2,
        'recommendation':["这个数据还有什么值得探索的"]
      }
