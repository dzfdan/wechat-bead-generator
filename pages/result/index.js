const { EXPORT_SCALE, PREVIEW_SCALE } = require('../../utils/constants');
const {
  renderBeadPreview,
  renderGuidePreview,
  renderExport
} = require('../../utils/canvas-renderer');

function getGridRowsForCanvas(result, selector) {
  if (selector === '#previewCanvas' && result.previewGridRows) {
    return result.previewGridRows;
  }

  return result.gridRows;
}

function getResultFromApp() {
  const app = getApp();
  return app && app.globalData ? app.globalData.currentResult : null;
}

Page({
  data: {
    result: null
  },

  onLoad() {
    const result = getResultFromApp();

    if (!result) {
      wx.showToast({
        title: '请重新生成拼豆图',
        icon: 'none'
      });
      wx.navigateBack({
        delta: 1
      });
      return;
    }

    this.setData({
      result
    });
  },

  onReady() {
    if (!this.data.result) {
      return;
    }

    this.renderCanvas('#previewCanvas', PREVIEW_SCALE, renderBeadPreview);
    this.renderCanvas('#guideCanvas', PREVIEW_SCALE, renderGuidePreview);
  },

  renderCanvas(selector, scale, renderer, callback) {
    const { result } = this.data;

    if (!result) {
      return;
    }

    wx.createSelectorQuery()
      .select(selector)
      .fields({ node: true, size: true })
      .exec((res) => {
        const target = res && res[0];

        if (!target || !target.node) {
          if (typeof callback === 'function') {
            callback(null);
          }
          return;
        }

        const canvas = target.node;
        const ctx = canvas.getContext('2d');
        const width = result.size * scale;
        const height = result.size * scale;
        const gridRows = getGridRowsForCanvas(result, selector);

        canvas.width = width;
        canvas.height = height;
        renderer(ctx, gridRows);

        if (typeof callback === 'function') {
          callback(canvas);
        }
      });
  },

  saveImage() {
    if (!this.data.result) {
      return;
    }

    this.renderCanvas('#exportCanvas', EXPORT_SCALE, renderExport, (canvas) => {
      if (!canvas) {
        wx.showToast({
          title: '导出失败',
          icon: 'none'
        });
        return;
      }

      wx.canvasToTempFilePath({
        canvas,
        success: ({ tempFilePath }) => {
          wx.saveImageToPhotosAlbum({
            filePath: tempFilePath,
            success: () => {
              wx.showToast({
                title: '已保存到相册'
              });
            },
            fail: () => {
              wx.showToast({
                title: '保存失败，请检查权限',
                icon: 'none'
              });
            }
          });
        },
        fail: () => {
          wx.showToast({
            title: '导出失败',
            icon: 'none'
          });
        }
      });
    });
  }
});
