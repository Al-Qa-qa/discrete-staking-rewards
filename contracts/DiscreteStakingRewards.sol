// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import {IERC20} from "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol"; // used in testing purposes

/**
 * @title Staking Rewards Smart contract
 * @author Al-Qa'qa'
 * @notice This contract works for staking tokens and earn rewards for staking
 */
contract DiscreteStakingRewards is Ownable {
  event Stake(address staker, uint256 amount);
  event UnStake(address staker, uint256 amount);
  event RewardsClaimed(address staker, uint256 reward);

  //////////////
  /// errors ///
  //////////////

  error DiscreteStakingRewards__ZeroRewards();
  error DiscreteStakingRewards__NoStakeTokens();

  /////////////////
  /// variables ///
  /////////////////

  IERC20 private immutable _i_stakingToken;
  IERC20 private immutable _i_rewardToken;

  uint256 public totalSupply;
  uint256 private rewardIndex;
  uint256 private constant MULTIPLIER = 1e18;

  // stakers stake tokens balance
  mapping(address => uint256) public balanceOf;
  // stakers rewardIndex
  mapping(address => uint256) private rewardIndexOf;
  // stakers rewardTokens balance (this is the value of the previous rewards of the staker, that is calculated when he made another stake)
  mapping(address => uint256) private earned;

  /**
   * @notice deploying `discreteStakingRewards` contract
   *
   * @param _stakingToken ERC20 token address that is used for staking
   * @param _rewardToken ERC20 token address that is used as rewards for stakers
   */
  constructor(address _stakingToken, address _rewardToken) {
    _i_stakingToken = IERC20(_stakingToken);
    _i_rewardToken = IERC20(_rewardToken);
  }

  /////////////////////////////////////
  /// External and Public functions ///
  /////////////////////////////////////

  /**
   * @notice Give an amount of reward tokens to the stakers
   * @param _reward Reward token amount to be given
   */
  function updateRewardIndex(uint256 _reward) external {
    if (totalSupply == 0) {
      revert DiscreteStakingRewards__NoStakeTokens();
    }
    _i_rewardToken.transferFrom(msg.sender, address(this), _reward);
    rewardIndex += (_reward * MULTIPLIER) / totalSupply;
  }

  /**
   * @notice calculate the amount of reward tokens earned for a given staker
   * @param _account Staker account address
   */
  function calculateRewardsEarned(
    address _account
  ) external view returns (uint256) {
    return earned[_account] + _calculateRewards(_account);
  }

  /**
   * @notice Add some tokens to the staking contract by the caller
   * @param _amount Staker account address
   */
  function stake(uint256 _amount) external {
    _updateRewards(msg.sender);

    _i_stakingToken.transferFrom(msg.sender, address(this), _amount);
    balanceOf[msg.sender] += _amount;
    totalSupply += _amount;

    emit Stake(msg.sender, _amount);
  }

  /**
   * @notice unStake amount staked by the staker
   * @param _amount Staker account address
   */
  function unStake(uint256 _amount) external {
    _updateRewards(msg.sender);

    // no need to check if _amount > balanceOf[sender], as it will reverts if there is underflow occuars
    balanceOf[msg.sender] -= _amount;
    totalSupply -= _amount;
    _i_stakingToken.transfer(msg.sender, _amount);

    emit UnStake(msg.sender, _amount);
  }

  /// @notice Caller will get his rewards for staking tokens
  function claim() external returns (uint256) {
    _updateRewards(msg.sender);

    uint256 reward = earned[msg.sender];

    if (reward == 0) {
      revert DiscreteStakingRewards__ZeroRewards();
    }

    earned[msg.sender] = 0;
    _i_rewardToken.transfer(msg.sender, reward);

    emit RewardsClaimed(msg.sender, reward);

    return reward;
  }

  //////////////////////////////////////
  /// Internal and Private functions ///
  //////////////////////////////////////

  /**
   * @notice get the rewards earned by the given staker account address
   * @param _account Staker address
   */
  function _calculateRewards(address _account) private view returns (uint256) {
    uint256 shares = balanceOf[_account];
    return (shares * (rewardIndex - rewardIndexOf[_account])) / MULTIPLIER;
  }

  /**
   * @notice updating staker data
   * @dev this function is fired before firing one of these functions [stake, unStake, claim]
   * @param _account Staker account address
   */
  function _updateRewards(address _account) private {
    earned[_account] += _calculateRewards(_account);
    rewardIndexOf[_account] = rewardIndex;
  }

  ///////////////////////
  /// Getter Function ///
  ///////////////////////

  function getStakingToken() public view returns (address) {
    return address(_i_stakingToken);
  }

  function getRewardToken() public view returns (address) {
    return address(_i_rewardToken);
  }
}
