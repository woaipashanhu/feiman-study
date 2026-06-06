/**
 * ============================================================
 *  视频缩略图池 — 全局 LRU 池
 *
 *  目的: 同时只播 12 个视频,超过的自动暂停最久不用的。
 *  - 用 Map 保持插入顺序(LRU 语义)
 *  - acquire 时如果池满,暂停最后一个、把新元素放第一个
 *  - release 时真正停止播放 + 释放
 *
 *  为什么需要这个:
 *  - iOS Safari 实际能播更多,但移动端发热/耗电严重
 *  - 用户列表滚动时,大量 video 同时尝试 play,体验差
 *  - 用池统一调度,行为可预期
 *
 *  注意: 池是单例,所有板块共享。
 *  - 数学/科学/社交/画廊/内功的视频缩略图都进同一个池
 *  - 切换板块时,旧的自动 release,新的 acquire
 * ============================================================
 */

class VideoPool {
  private maxConcurrent = 12
  private registry = new Map<string, HTMLVideoElement>()

  /**
   * 申请播放权
   * - 同一个 id 重复 acquire: 刷新到最前(MRU)
   * - 池满: 暂停最后一个(最久不用的),新元素放最前
   */
  acquire(id: string, el: HTMLVideoElement) {
    // 已经在池里 → 刷新到最前
    if (this.registry.has(id)) {
      this.registry.delete(id)
      this.registry.set(id, el)
      el.play().catch(() => {
        /* autoplay blocked, ignore */
      })
      return
    }

    // 池满 → 暂停最久不用的
    if (this.registry.size >= this.maxConcurrent) {
      const oldestId = this.registry.keys().next().value
      if (oldestId) {
        const oldestEl = this.registry.get(oldestId)
        if (oldestEl) {
          oldestEl.pause()
        }
        this.registry.delete(oldestId)
      }
    }

    // 注册新元素并播放
    this.registry.set(id, el)
    el.play().catch(() => {
      /* autoplay blocked, ignore */
    })
  }

  /**
   * 释放播放权
   * - 真正 pause + 从池中移除
   * - 找不到时 silently 忽略
   */
  release(id: string, el?: HTMLVideoElement) {
    if (!this.registry.has(id)) return
    const target = el ?? this.registry.get(id)
    if (target) {
      target.pause()
    }
    this.registry.delete(id)
  }

  /**
   * 清空池(用于路由切换/强制重置)
   */
  clear() {
    this.registry.forEach((el) => el.pause())
    this.registry.clear()
  }

  /**
   * 调试用: 当前池大小
   */
  get size() {
    return this.registry.size
  }
}

export const videoPool = new VideoPool()
