const Koa = require('koa')
const Router = require('@koa/router')
const { koaBody } = require('koa-body');
const cors = require('@koa/cors');
const { PrismaClient } = require('@prisma/client')
const OSS = require('ali-oss');
const path=require("path")
const http = require("http");
const https = require("https");
const fs = require("fs");

const {listBuckets,listImgsWithPrefix,deleteImg,deleteImgsWithPrefix,initialSts} = require('./oss')

const app = new Koa()
const router = new Router()
const prisma = new PrismaClient()

const arn = 'acs:ram::1753422922186288:role/ramosstest'

const pageSize = 10; // 每页10个壁纸
const pageNumber = 1; // 第一页

app.use(koaBody()).use(cors());

router.post('/getCollectionList', async (ctx) => {
  console.log("qly ~ getCollectionList", ctx.request.body)
  const { collectionName } = ctx.request.body
  const findManyParams = {
    orderBy: {
      updatedAt: 'desc',
    },
  };

  if (collectionName !== '') {
    findManyParams.where = { title: collectionName };
  }

  const collectionList = await prisma.collection.findMany(findManyParams);
  console.log("qly ~ getCollectionList:", collectionList)
  ctx.status = 200
  ctx.body = collectionList
})

router.post('/getCollectionItem', async (ctx) => {
  console.log("qly ~ getCollectionItem", ctx.request.body)
  const { id } = ctx.request.body
  const collectionItem = await prisma.collection.findUnique({
    where: {
      id,
    },
  })
  console.log("qly ~ collectionItem:", collectionItem)
  ctx.status = 200
  ctx.body = collectionItem
})

router.post('/addOrUpdateCollection', async (ctx) => {
  console.log("qly ~ addOrUpdateCollection body", ctx.request.body)
  const { id, title, enTitle, description } = ctx.request.body
  if (id) {
    try {
      const updatedCollectionData = await prisma.collection.update({
        where: {
          id,
        },
        data: {
          title,
          enTitle,
          description,
        },
      })

      ctx.status = 200
      ctx.body = {
        success: true,
        data: updatedCollectionData
      }
    } catch (error) {
      if (error.code === 'P2002') {
        const errMsg = '该合集已存在，无法创建。'
        console.log(errMsg);
        ctx.status = 200
        ctx.body = {
          success: false,
          errMsg: errMsg
        }
      } else {
        ctx.status = 500
        ctx.body = {
          success: false,
          errMsg: '未知错误'
        }
      }
    }
  } else {
    try {
      const newCollectionData = await prisma.collection.create({
        data: {
          title,
          enTitle,
          description,
        },
      })

      ctx.status = 200
      ctx.body = ctx.body = {
        success: true,
        data: newCollectionData
      }
    } catch (error) {
      if (error.code === 'P2002') {
        const errMsg = '该合集已存在，无法创建。'
        console.log(errMsg);
        ctx.status = 200
        ctx.body = {
          success: false,
          errMsg: errMsg
        }
      } else {
        ctx.status = 500
        ctx.body = {
          success: false,
          errMsg: '未知错误'
        }
      }
    }
  }
})

router.post('/deleteCollection', async (ctx) => {
  console.log("qly ~ deleteCollection", ctx.request.body)
  const { id } = ctx.request.body

  try {
    const deletedCollection = await prisma.collection.delete({
      where: {
        id,
      },
    })

    ctx.body = deletedCollection
  } catch {
    ctx.status = 404
    ctx.body = { error: `Collection with ID ${id} does not exist in the database` }
  }
})

router.post('/getWallpaperList', async (ctx) => {
  console.log("qly ~ getWallpaperList", ctx.request.body)
  const { collectionId } = ctx.request.body
  const wallpaperList = await prisma.wallpaper.findMany({
    where: {
      collectionId,
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });
  console.log("qly ~ getWallpaperList:", wallpaperList)
  ctx.status = 200
  ctx.body = wallpaperList
})

router.post('/addOrUpdateWallpaper', async (ctx) => {
  console.log("qly ~ addOrUpdateWallpaper body", ctx.request.body)
  const { id, title, enTitle, tags, collectionId, authorId } = ctx.request.body
  if (id) {
    try {
      const wallpaperData = await prisma.wallpaper.update({
        where: {
          id,
        },
        data: {
          title,
          enTitle,
          tags,
        },
      })

      ctx.status = 200
      ctx.body = {
        success: true,
        data: wallpaperData
      }
    } catch (error) {
      if (error.code === 'P2002') {
        const errMsg = '该壁纸已存在，无法创建。'
        console.log(errMsg);
        ctx.status = 200
        ctx.body = {
          success: false,
          errMsg: errMsg
        }
      } else {
        ctx.status = 500
        ctx.body = {
          success: false,
          errMsg: '未知错误'
        }
      }
    }
  } else {
    try {
      const newWallpaperData = await prisma.wallpaper.create({
        data: {
          title,
          enTitle,
          tags,
          collectionId, 
          authorId
        },
      })

      ctx.status = 200
      ctx.body = ctx.body = {
        success: true,
        data: newWallpaperData
      }
    } catch (error) {
      if (error.code === 'P2002') {
        const errMsg = '该壁纸已存在，无法创建。'
        console.log(errMsg);
        ctx.status = 200
        ctx.body = {
          success: false,
          errMsg: errMsg
        }
      } else {
        ctx.status = 500
        ctx.body = {
          success: false,
          errMsg: '未知错误'
        }
      }
    }
  }
})

router.post('/deleteWallpaper', async (ctx) => {
  console.log("qly ~ deleteWallpaper", ctx.request.body)
  const { id } = ctx.request.body

  try {
    const deletedWallpaper = await prisma.wallpaper.delete({
      where: {
        id,
      },
    })

    ctx.body = deletedWallpaper
  } catch {
    ctx.status = 404
    ctx.body = { error: `Collection with ID ${id} does not exist in the database` }
  }
})

router.post('/getAuthorList', async (ctx) => {
  const authorList = await prisma.author.findMany({
    orderBy: {
      updatedAt: 'desc',
    },
  });
  console.log("qly ~ getAuthorList:", authorList)
  ctx.status = 200
  ctx.body = authorList
})

router.get('/getAuthorList', async (ctx) => {
  const authorList = await prisma.author.findMany({
    orderBy: {
      updatedAt: 'desc',
    },
  });
  console.log("qly ~ getAuthorList:", authorList)
  ctx.status = 200
  ctx.body = authorList
})

router.post('/addOrUpdateAuthor', async (ctx) => {
  console.log("qly ~ addOrUpdateAuthor body", ctx.request.body)
  const { id, name } = ctx.request.body
  if (id) {
    try {
      const authorData = await prisma.author.update({
        where: {
          id,
        },
        data: {
          name
        },
      })

      ctx.status = 200
      ctx.body = {
        success: true,
        data: authorData
      }
    } catch (error) {
      if (error.code === 'P2002') {
        const errMsg = '该作者已存在，无法创建。'
        console.log(errMsg);
        ctx.status = 200
        ctx.body = {
          success: false,
          errMsg: errMsg
        }
      } else {
        ctx.status = 500
        ctx.body = {
          success: false,
          errMsg: '未知错误'
        }
      }
    }
  } else {
    try {
      const newAuthorData = await prisma.author.create({
        data: {
          name
        },
      })

      ctx.status = 200
      ctx.body = ctx.body = {
        success: true,
        data: newAuthorData
      }
    } catch (error) {
      if (error.code === 'P2002') {
        const errMsg = '该作者已存在，无法创建。'
        console.log(errMsg);
        ctx.status = 200
        ctx.body = {
          success: false,
          errMsg: errMsg
        }
      } else {
        ctx.status = 500
        ctx.body = {
          success: false,
          errMsg: '未知错误'
        }
      }
    }
  }
})

router.post('/deleteAuthor', async (ctx) => {
  console.log("qly ~ deleteAuthor", ctx.request.body)
  const { id } = ctx.request.body

  try {
    const deletedAuthor = await prisma.author.delete({
      where: {
        id,
      },
    })

    ctx.body = deletedAuthor
  } catch {
    ctx.status = 404
    ctx.body = { error: `Author with ID ${id} does not exist in the database` }
  }
})

router.post('/getProtocol', async (ctx) => {
  const protocol = await prisma.protocol.findMany();
  console.log("qly ~ getProtocol:", protocol)
  ctx.status = 200
  ctx.body = protocol
})

router.post('/addOrUpdateProtocol', async (ctx) => {
  console.log("qly ~ addOrUpdateProtocol body", ctx.request.body)
  const { id, ...restData } = ctx.request.body
  if (id) {
    try {
      const protocolData = await prisma.protocol.update({
        where: {
          id,
        },
        data: restData,
      })

      ctx.status = 200
      ctx.body = {
        success: true,
        data: protocolData
      }
    } catch (error) {
        ctx.status = 500
        ctx.body = {
          success: false,
          errMsg: '未知错误'
        }
    }
  } else {
    try {
      const newProtocolData = await prisma.protocol.create({
        data: restData,
      })

      ctx.status = 200
      ctx.body = ctx.body = {
        success: true,
        data: newProtocolData
      }
    } catch (error) {
        console.log("qly ~ router.post ~ error:", error)
        ctx.status = 500
        ctx.body = {
          success: false,
          errMsg: '未知错误'
    }
  }
}
})

router.get('/get_sts_token_for_oss_upload', async (ctx) => {
  let sts = initialSts()
   // roleArn填写步骤2获取的角色ARN，例如acs:ram::175708322470****:role/ramtest。
   // policy填写自定义权限策略，用于进一步限制STS临时访问凭证的权限。如果不指定Policy，则返回的STS临时访问凭证默认拥有指定角色的所有权限。
   // 3000为过期时间，单位为秒。
   // sessionName用于自定义角色会话名称，用来区分不同的令牌，例如填写为sessiontest。
   const result = await sts.assumeRole(arn, ``, '3000', 'sessiontest')
     console.log('sts', result.credentials);
     ctx.status = 200
     ctx.body = {
      AccessKeyId: result.credentials.AccessKeyId,
      AccessKeySecret: result.credentials.AccessKeySecret,
      SecurityToken: result.credentials.SecurityToken,
    }
 });

router.post('/getImgsWithPrefix', async (ctx) => {
  console.log("qly ~ getImgsWithPrefix", ctx.request.body)
  const { collectionEnTitle, wallpaperEnTitle } = ctx.request.body
  const prefix = `${collectionEnTitle}/${wallpaperEnTitle}/`;

  try {
    const result = await listImgsWithPrefix(prefix);
    ctx.status = 200
    ctx.body = result.objects
  } catch {
    ctx.status = 500
    ctx.body = { error: `can not find imgs in ${prefix}` }
  }
})

router.post('/deleteImg', async (ctx) => {
  const { name } = ctx.request.body

  try {
    const result = await deleteImg(name);
    console.log("qly ~ deleteImg ~ result:", result)
    ctx.status = 200
  } catch {
    ctx.status = 500
    ctx.body = { error: `delete img failed, name:${name}` }
  }
})

router.post('/deleteImgsWithPrefix', async (ctx) => {
  console.log("qly ~ deleteImgsWithPrefix", ctx.request.body)
  const { collectionEnTitle, wallpaperEnTitle } = ctx.request.body
  const prefix = `${collectionEnTitle}/${wallpaperEnTitle}/`;

  try {
    const result = await deleteImgsWithPrefix(prefix);
    console.log("qly ~ deleteImgsWithPrefix ~ result:", result)
    ctx.status = 200
    ctx.body = result.objects
  } catch {
    ctx.status = 500
    ctx.body = { error: `can not find imgs in ${prefix}` }
  }
})

// 首页--合集列表
router.post('/mobile/getCollectionList', async (ctx) => {
  const { pageNumber } = ctx.request.body
  // 计算要跳过的记录数量
 const skipAmount = (pageNumber - 1) * pageSize;
  let collectionList = await prisma.collection.findMany({
    orderBy: {
      updatedAt: 'desc',
    },
    take:10,
    include: {
      wallpaperList: true
    }
  });
  if(collectionList.length > 0){
    for(let i=0;i<collectionList.length;i++){
      for(let j=0;j<collectionList[i].wallpaperList.length;j++){
        const prefix = `${collectionList[i].enTitle}/${collectionList[i].wallpaperList[j].enTitle}/`;
        const imgs = await listImgsWithPrefix(prefix);
        collectionList[i].wallpaperList[j]['imgs'] = imgs.objects
      }
    }
  }
  ctx.status = 200
  ctx.body = collectionList
})

// 合集--壁纸列表
router.post('/mobile/getWallpaperList', async (ctx) => {
  console.log("qly ~ getWallpaperList", ctx.request.body)
  const { collectionId, collectionEnTitle } = ctx.request.body
  const wallpaperList = await prisma.wallpaper.findMany({
    where: {
      collectionId,
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });
  for(let j=0;j<wallpaperList.length;j++){
    const prefix = `${collectionEnTitle}/${wallpaperList[j].enTitle}/`;
    const imgs = await listImgsWithPrefix(prefix);
    const coverImg = imgs.objects.filter((item) => item.name.includes('cover'))
    wallpaperList[j]['coverImg'] = coverImg[0]
  }
  console.log("qly ~ getWallpaperList:", wallpaperList)
  ctx.status = 200
  ctx.body = wallpaperList
})

// 壁纸详情
router.post('/mobile/getWallpaperImgsList', async (ctx) => {
  console.log("qly ~ getWallpaperList", ctx.request.body)
  const { collectionEnTitle,wallpaperEnTitle } = ctx.request.body
    const prefix = `${collectionEnTitle}/${wallpaperEnTitle}/`;
    const imgs = await listImgsWithPrefix(prefix);
    const imgsList = imgs.objects.filter((item) => !item.name.includes('cover'))
    wallpaperList[j]['coverImg'] = coverImg[0]
  
  ctx.status = 200
  ctx.body = imgsList
})

app.use(router.routes()).use(router.allowedMethods())

app.listen(3001, () =>
  console.log(`
🚀 Server ready at: http://localhost:3001`),
)