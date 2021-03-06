import React, { PropTypes, Component } from 'react';
import EditCardForm from './EditCardForm';
import Comments from './Comments';
import Icon from './Icon';
import CardColors from './CardColors';

class FullCard extends Component {
  constructor(props) {
    super(props);

    this.handleEditCardFormSubmit = this.handleEditCardFormSubmit.bind(this);

    this.state = {
      isEditing: false,
    };
  }

  hideEditForm() {
    this.setState({
      isEditing: false,
    });
  }

  showEditForm() {
    this.setState({
      isEditing: true,
    });
  }

  handleEditCardFormSubmit(formData) {
    this.props.onEditCardFormSubmit(formData);
    this.hideEditForm();
  }

  render() {
    const { isEditing } = this.state;
    const {
      card,
      onSendCommentSubmit,
      onRemoveCommentClick,
      onColorClick,
    } = this.props;

    return (
      <div className="b-full-card">
        <div className="b-full-card__text">
          {isEditing ? (
            <EditCardForm
              text={card.text}
              onSubmit={this.handleEditCardFormSubmit}
              onCancel={() => this.hideEditForm()}
            />
            ) : (
              <div className="b-card-text">
                <div className="b-card-text__text">
                  {card.text}
                </div>
                <a
                  className="b-card-text__edit"
                  onClick={() => this.showEditForm()}
                >
                  <Icon name="pencil" />
                </a>
              </div>
          )}
        </div>
        <div className="b-full-card__colors">
          <span className="b-full-card__subtitle">
            Colors:
          </span>
          <CardColors
            colors={card.colors}
            onColorClick={onColorClick}
          />
        </div>
        <div className="b-full-card__comments">
          <Comments
            comments={card.comments}
            cardId={card.id}
            onSendCommentSubmit={onSendCommentSubmit}
            onRemoveClick={onRemoveCommentClick}
          />
        </div>
      </div>
    );
  }
}

FullCard.propTypes = {
  card: PropTypes.shape({
    id: PropTypes.string.isRequired,
    text: PropTypes.string.isRequired,
    comments: PropTypes.array,
  }),
  onEditCardFormSubmit: PropTypes.func.isRequired,
  onSendCommentSubmit: PropTypes.func.isRequired,
  onRemoveCommentClick: PropTypes.func.isRequired,
  onColorClick: PropTypes.func.isRequired,
};

export default FullCard;
