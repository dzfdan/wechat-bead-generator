const { SIZE_OPTIONS } = require('../../utils/constants');
const { createSessionStore } = require('../../utils/session-store');
const { buildBeadGrid, buildResultModel } = require('../../utils/bead-generator');
const { sampleImagePixels } = require('../../utils/image-sampler');

const store = createSessionStore();

function cloneResult(result) {
  return {
    ...result,
    previewGridRows: result.previewGridRows.map((row) => row.map((cell) => ({ ...cell }))),
    gridRows: result.gridRows.map((row) => row.map((cell) => ({ ...cell }))),
    usage: result.usage.map((item) => ({ ...item }))
  };
}

Page({
  data: {
    imagePath: '',
    sizeOptions: SIZE_OPTIONS,
    selectedSize: SIZE_OPTIONS[0].value,
    generating: false
  },

  chooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      success: ({ tempFiles }) => {
        this.setData({
          imagePath: tempFiles[0].tempFilePath
        });
      }
    });
  },

  onSizeChange(event) {
    this.setData({
      selectedSize: Number(event.currentTarget.dataset.value)
    });
  },

  async generateResult() {
    if (!this.data.imagePath) {
      wx.showToast({
        title: '请先选择图片',
        icon: 'none'
      });
      return;
    }

    this.setData({
      generating: true
    });

    try {
      let pixels;

      try {
        pixels = await sampleImagePixels({
          page: this,
          selector: '#sourceCanvas',
          imagePath: this.data.imagePath,
          size: this.data.selectedSize
        });
      } catch (error) {
        wx.showToast({
          title: '图片解析失败，请重新选择',
          icon: 'none'
        });
        return;
      }

      try {
        const grid = buildBeadGrid({
          pixels,
          width: this.data.selectedSize,
          height: this.data.selectedSize
        });
        const result = {
          sourceImagePath: this.data.imagePath,
          ...buildResultModel({
            grid,
            size: this.data.selectedSize
          })
        };

        store.set(result);
        getApp().globalData.currentResult = cloneResult(store.get());

        wx.navigateTo({
          url: '/pages/result/index'
        });
      } catch (error) {
        wx.showToast({
          title: '拼豆图生成失败，请重试',
          icon: 'none'
        });
      }
    } finally {
      this.setData({
        generating: false
      });
    }
  }
});
