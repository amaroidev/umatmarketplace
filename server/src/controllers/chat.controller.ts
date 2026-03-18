import { Request, Response, NextFunction } from 'express';
import chatService from '../services/chat.service';

/**
 * @route   POST /api/conversations
 * @desc    Get or create a conversation with another user (optionally about a product)
 * @access  Private
 */
export const getOrCreateConversation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { otherUserId, productId } = req.body;
    const conversation = await chatService.getOrCreateConversation(
      req.user!._id.toString(),
      otherUserId,
      productId
    );

    res.status(200).json({
      success: true,
      data: { conversation },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/conversations
 * @desc    Get all conversations for the current user
 * @access  Private
 */
export const getUserConversations = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const conversations = await chatService.getUserConversations(
      req.user!._id.toString()
    );

    res.status(200).json({
      success: true,
      data: { conversations },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/conversations/:id/messages
 * @desc    Get messages for a conversation (paginated)
 * @access  Private (participant only)
 */
export const getMessages = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const result = await chatService.getMessages(
      id,
      req.user!._id.toString(),
      page,
      limit
    );

    res.status(200).json({
      success: true,
      data: {
        messages: result.messages,
        pagination: result.pagination,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/conversations/:id/messages
 * @desc    Send a message in a conversation
 * @access  Private (participant only)
 */
export const sendMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { content, type, offer, quickReplyLabel, attachments } = req.body;

    const message = await chatService.sendMessage(
      id,
      req.user!._id.toString(),
      content,
      type,
      { offer, quickReplyLabel, attachments }
    );

    res.status(201).json({
      success: true,
      data: { message },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/conversations/:id/read
 * @desc    Mark all messages in a conversation as read
 * @access  Private (participant only)
 */
export const markAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const count = await chatService.markAsRead(
      id,
      req.user!._id.toString()
    );

    res.status(200).json({
      success: true,
      data: { markedRead: count },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/conversations/unread-count
 * @desc    Get total unread message count for the current user
 * @access  Private
 */
export const getUnreadCount = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const count = await chatService.getUnreadCount(
      req.user!._id.toString()
    );

    res.status(200).json({
      success: true,
      data: { unreadCount: count },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/conversations/:id
 * @desc    Delete a conversation and its messages
 * @access  Private (participant only)
 */
export const deleteConversation = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    await chatService.deleteConversation(
      id,
      req.user!._id.toString()
    );

    res.status(200).json({
      success: true,
      message: 'Conversation deleted',
    });
  } catch (error) {
    next(error);
  }
};
