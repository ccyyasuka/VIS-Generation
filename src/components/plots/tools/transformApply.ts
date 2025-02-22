export default function applyTransformations(data: any[],transform:any) {
  if (!transform) return data;


  let transformedData = [...data];

  switch (transform.type) {
    case 'filter':
      if (transform.config) {
        const { dimension, condition, value } = transform.config;
        transformedData = transformedData.filter((item) => {
          const itemValue = Number(item[dimension]);
          const comparisonValue = Number(value);

          // 检查是否转换成功
          const isValidItemValue = !isNaN(itemValue);
          const isValidComparisonValue = !isNaN(comparisonValue);

          if (!isValidItemValue || !isValidComparisonValue) {
            // 根据业务逻辑，选择是跳过该条目还是将其包含在内
            // 这里选择的是跳过无法转换成数字的条目
            return false;
          }
          switch (condition) {
            case '<':
              return itemValue < value;
            case '>':
              return itemValue > value;
            case '=':
              return itemValue === value;
            case '!=':
              return itemValue !== value;
            default:
              return true;
          }
        });
      }
      break;

      case 'groupBy':

        if (transform.config) {
        
          const { dimension, condition } = transform.config;
          
          const grouped = transformedData.reduce((acc: any, item: any) => {
          
          const groupKey = item[dimension];
        
        if (!acc[groupKey]) {
        
          acc[groupKey] = [];
          
          }
          
          acc[groupKey].push(item);
        
          return acc;
        
        }, {});
        
        // 确定所有数值字段（排除分组维度）
        
        const numericFields = new Set<string>();
        
        transformedData.forEach(item => {
        
        Object.keys(item).forEach(key => {
        
        if (key !== dimension && typeof item[key] === 'number') {
        
        numericFields.add(key);
        
        }
        
        });
        
        });
        
        transformedData = Object.keys(grouped).map((groupKey) => {
        
        const groupItems = grouped[groupKey];
        
        const result: { [key: string]: any } = { [dimension]: groupKey };
        
        // 对每个数值字段进行聚合
        
        Array.from(numericFields).forEach(field => {
        
        switch (condition) {
        
        case 'sum':
        
        result[field] = groupItems.reduce((sum: number, item: any) => sum + (item[field] || 0), 0);
        
        break;
        
        case 'avg':
        
        const total = groupItems.reduce((sum: number, item: any) => sum + (item[field] || 0), 0);
        
        result[field] = total / groupItems.length;
        
        break;
        
        case 'count':
        
        result[field] = groupItems.length;
        
        break;
        
        // 其他条件处理...
        
        default:
        
        // 默认处理，可能抛出错误或忽略
        
        break;
        
        }
        
        });
        
        return result;
        
        });
        
        }
        
        break;  

    case 'sort':
      if (transform.config) {
        const { dimension, condition } = transform.config;
        if (condition === 'asc') {
          transformedData.sort((a, b) => a[dimension] - b[dimension]);
        } else if (condition === 'desc') {
          transformedData.sort((a, b) => b[dimension] - a[dimension]);
        }
      }
      break;

    default:
      break;
  }

  return transformedData;
}