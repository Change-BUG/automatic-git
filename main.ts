import { exec } from 'child_process'; // 命令行执行
import { App, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
  CommitAndPushTime: number;
  CommitAndPushDisable: boolean;
  CommitAndPushTimeZ: Date;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
  CommitAndPushTime: 1,
  CommitAndPushDisable: false,
  CommitAndPushTimeZ: new Date(new Date().getTime() + (1 * 60 * 1000))
}

export default class MyPlugin extends Plugin {
  settings: MyPluginSettings;

  async onload() {
    await this.loadSettings();

    // // 这将在左侧功能区中创建一个图标。
    // const ribbonIconEl = this.addRibbonIcon('dice', 'Sample Plugin', (evt: MouseEvent) => {
    //   // 当用户单击图标时调用。
    //   new Notice('This is a notice!');
    // });
    // // 使用功能区执行其他操作
    // ribbonIconEl.addClass('my-plugin-ribbon-class');

    // 这将在应用程序底部添加一个状态栏项目。 不适用于移动应用程序。
    // const statusBarItemEl = this.addStatusBarItem();
    // statusBarItemEl.setText('Status Bar Text');

    // 这添加了一个设置选项卡，以便用户可以配置插件的各个方面
    this.addSettingTab(new SampleSettingTab(this.app, this));

    // 如果插件连接任何全局 DOM 事件（在不属于该插件的应用程序部分）
    // 当此插件被禁用时，使用此函数将自动删除事件监听器。
    // this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
    //   console.log('点击启用插件 事件', evt);
    // });

    // 注册间隔时，该函数会在插件禁用时自动清除间隔。
    this.settings.CommitAndPushTimeZ = new Date(new Date().getTime() + this.settings.CommitAndPushTime * 60 * 1000); // 
    console.log('初始化 执行自动提交的时间', this.settings.CommitAndPushTimeZ);
    this.registerInterval(window.setInterval(() => GlobalTasks(this.settings), 1000));

  }

  onunload() { }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}

// PluginSettingTab 插件设置
class SampleSettingTab extends PluginSettingTab {
  plugin: MyPlugin;
  constructor(app: App, plugin: MyPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl).setName('开启git自动提交').setDesc('开启git自动提交')
      .addToggle((toggle) => toggle
        .setValue(this.plugin.settings.CommitAndPushDisable)
        .onChange((value) => {
          this.plugin.settings.CommitAndPushDisable = value;
        })
      );

    new Setting(containerEl).setName('设置git自动提交时间').setDesc('设置git自动提交时间')
      .addText(text => text
        .setPlaceholder('设置git自动提交时间')
        .setValue(String(this.plugin.settings.CommitAndPushTime))
        .onChange(async (value) => {
          this.plugin.settings.CommitAndPushTime = Number(value);
          await this.plugin.saveSettings();
        })
      );

  }
}

// 全局定时任务
function GlobalTasks(settings: MyPluginSettings) {
  // console.log(settings);
  // 设置为零 不执行
  if (settings.CommitAndPushTime === 0) {
    return
  }

  // 判断 是否开启 自动提交
  const basePath: string = this.app.vault.adapter.basePath;
  const currentTime = new Date();
  if (settings.CommitAndPushDisable) {
    // 判断 设置的时间达到没有
    if (currentTime >= settings.CommitAndPushTimeZ) {

      executeCommandLineCommand(basePath)

      settings.CommitAndPushTimeZ = new Date(currentTime.getTime() + settings.CommitAndPushTime * 60 * 1000);
      console.log('下一次 执行自动提交的时间', settings.CommitAndPushTimeZ);
    }
  }
}

// -----------------------------------------------------------------------------------

// 执行命令
function executeCommandLineCommand(cwd: string) {
  // 添加提交文件
  exec("git add .", { cwd }, (error, stdout, stderr) => {
    if (error) {
      console.error(`error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`);
      return;
    }

    // 添加提交文件成功 然后去提交本地
    console.log(`添加提交文件: ${stdout}`);
    if (stdout) {
      return
    }
    const commit = 'git commit -m "' + formatDate(new Date()) + '"'
    exec(commit, { cwd }, (error, stdout, stderr) => {
      if (error) {
        console.error(`error: ${error.message}`);
        return;
      }
      if (stderr) {
        console.error(`stderr: ${stderr}`);
        return;
      }

      // 提交本地成功 然后提交远程
      console.log(`提交本地文件: ${stdout}`);
      if (!stdout) {
        return
      }

      exec("git push", { cwd }, (error, stdout, stderr) => {
        if (error) {
          console.error(`error: ${error.message}`);
          return;
        }
        if (stderr) {
          new Notice(stderr, 3000) // 弹出提示框
          console.error(`stderr: ${stderr}`)
          return
        }

        new Notice(stdout, 3000) // 弹出提示框
        console.log(`提交远程文件: ${stdout}`);
      });
    });
  });
}

// 格式化 时间
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${day}-${month} ${hours}:${minutes}:${seconds}`;
}