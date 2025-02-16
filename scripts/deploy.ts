import { NodeSSH } from "node-ssh";
import { config } from "dotenv";
import { join } from "path";
import { execSync } from "child_process";
import { existsSync } from "fs";

// 加载环境变量
config();

const ssh = new NodeSSH();

// 构建项目
async function build() {
  console.log("🚀 开始构建项目...");
  execSync("pnpm build-only", { stdio: "inherit" });
  console.log("✅ 构建完成");
}

// 连接服务器
async function connect() {
  console.log("🔑 连接服务器...");

  const config: any = {
    host: process.env.DEPLOY_HOST,
    port: parseInt(process.env.DEPLOY_PORT || "22"),
    username: process.env.DEPLOY_USERNAME,
  };

  // 根据配置决定使用密码还是私钥
  if (process.env.DEPLOY_PRIVATE_KEY) {
    config.privateKey = process.env.DEPLOY_PRIVATE_KEY;
  } else if (process.env.DEPLOY_PASSWORD) {
    config.password = process.env.DEPLOY_PASSWORD;
  } else {
    throw new Error("需要提供密码或私钥");
  }

  await ssh.connect(config);
  console.log("✅ 服务器连接成功");
}

// 部署文件
async function deploy() {
  const distPath = join(process.cwd(), "dist");
  const remotePath = process.env.DEPLOY_PATH;

  if (!existsSync(distPath)) {
    throw new Error("dist 目录不存在，请先构建项目");
  }

  if (!remotePath) {
    throw new Error("请在 .env 文件中设置 DEPLOY_PATH");
  }

  console.log("📦 开始上传文件...");

  // 确保远程目录存在
  await ssh.execCommand(`mkdir -p ${remotePath}`);

  // 上传文件
  await ssh.putDirectory(distPath, remotePath, {
    recursive: true,
    concurrency: 10,
    tick: (localPath, remotePath, error) => {
      if (error) {
        console.error(`❌ 上传失败: ${localPath}`);
      } else {
        console.log(`✅ 上传成功: ${localPath}`);
      }
    },
  });

  console.log("🎉 部署完成");
}

// 主函数
async function main() {
  try {
    await build();
    await connect();
    await deploy();
  } catch (error) {
    console.error("❌ 部署失败:", error);
    process.exit(1);
  } finally {
    ssh.dispose();
  }
}

main();
