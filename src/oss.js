const OSS = require('ali-oss');

const accessKeyId = 'LTAI5tKEJY6tAioCB2MmcxoP';
// 配置环境变量ALIBABA_CLOUD_ACCESS_SECRET。
const accessKeySecret = 'zBw2BoPGBlf0UGMSgI5wH5iiJ84e0o';

// 初始化OSS客户端。请将以下参数替换为您自己的配置信息。
const client = new OSS({
  region: 'oss-cn-hangzhou', // 示例：'oss-cn-hangzhou'，填写Bucket所在地域。
  accessKeyId, // 确保已设置环境变量OSS_ACCESS_KEY_ID。
  accessKeySecret, // 确保已设置环境变量OSS_ACCESS_KEY_SECRET。
  bucket: 'bzgxs-wallpaper', // 示例：'my-bucket-name'，填写存储空间名称。
});

// 列举所有存储空间
const listBuckets=  async () =>{
    try {
      // 列举当前账号所有地域下的存储空间。
      const result = await client.listBuckets();
      console.log(result);
    } catch (err) {
      console.log(err);
    }
  }

//  列举指定前缀的文件
const listImgsWithPrefix = async (prefix)=> {
  return await client.list({
    prefix
  });
}

// 删除单个文件
const deleteImg = async (name) => {
    console.log("qly ~ deleteImg ~ name:", name)
      // 填写Object完整路径。Object完整路径中不能包含Bucket名称。
     return await client.delete(name);
  }

  //删除指定前缀的多个文件
  const deleteImgsWithPrefix=async (prefix) =>{
    const list = await listImgsWithPrefix(prefix);
    console.log("qly ~ deleteImgsWithPrefix ~ list:", list)
    const result = await Promise.all(list.objects.map((v) => deleteImg(v.name)));
    console.log("qly ~ deleteImgsWithPrefix ~ result:", result)
    return result;
  }

exports.listBuckets = listBuckets;
exports.listImgsWithPrefix = listImgsWithPrefix;
exports.deleteImg = deleteImg;
exports.deleteImgsWithPrefix = deleteImgsWithPrefix;